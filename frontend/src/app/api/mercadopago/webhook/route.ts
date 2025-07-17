import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { prisma } from '@/lib/prisma';

interface WebhookBody {
    type: string;
    data?: {
        id?: string;
    };
}

const accessToken = process.env.MP_ACCESS_TOKEN;
if (!accessToken) {
    console.error("MercadoPago access token is not configured.");
}
const mercadoPagoClient = new MercadoPagoConfig({ accessToken: accessToken || '' });

export async function POST(req: NextRequest) {
    try {
        const body: WebhookBody = await req.json();
        console.log('Webhook body:', body);

        if (body.type === 'payment' && body.data?.id) {
            if (!accessToken) {
                throw new Error("MercadoPago access token is not configured.");
            }
            
            const paymentId = body.data.id;
            const payment = new Payment(mercadoPagoClient);

            let mpData = null;
            let retries = 3;
            while (retries-- > 0) {
                try {
                    mpData = await payment.get({ id: paymentId });
                    break;
                } catch (error: unknown) {
                    if (
                        typeof error === 'object' &&
                        error !== null &&
                        'status' in error &&
                        (error as { status: unknown }).status === 404
                    ) {
                        console.log(`Pago ${paymentId} aún no disponible. Reintentando...`);
                        if (retries > 0) {
                            await new Promise(r => setTimeout(r, 1000));
                        }
                    } else {
                        throw error;
                    }
                }
            }

            if (!mpData) {
                console.warn(`Payment ${paymentId} could not be retrieved after 3 attempts.`);
                return NextResponse.json({ error: 'Pago no encontrado aún' }, { status: 202 });
            }

            console.log('Pago obtenido:', mpData);

            if (mpData.external_reference) {
                console.log(`Procesando pago con external_reference: ${mpData.external_reference}`);
                
                // Buscar el pedido por external_reference (paymentId)
                const pedido = await prisma.pedido.findFirst({
                    where: { paymentId: mpData.external_reference },
                    include: {
                        items: {
                            include: {
                                libro: true
                            }
                        }
                    }
                });

                if (!pedido) {
                    console.error(`Pedido no encontrado para external_reference: ${mpData.external_reference}`);
                    return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
                }

                console.log(`Pedido encontrado: ${pedido.id}, estado actual: ${pedido.paymentStatus}`);

                // Actualizar el estado del pedido según el estado del pago
                let newPaymentStatus = mpData.status;
                
                // Mapear estados de MercadoPago a estados más descriptivos
                switch (mpData.status) {
                    case 'approved':
                        newPaymentStatus = 'approved';
                        break;
                    case 'pending':
                        newPaymentStatus = 'pending';
                        break;
                    case 'rejected':
                        newPaymentStatus = 'rejected';
                        break;
                    case 'cancelled':
                        newPaymentStatus = 'cancelled';
                        break;
                    case 'refunded':
                        newPaymentStatus = 'refunded';
                        break;
                    default:
                        newPaymentStatus = mpData.status;
                }

                // Actualizar el estado del pedido
                await prisma.pedido.update({
                    where: { id: pedido.id },
                    data: { paymentStatus: newPaymentStatus },
                });

                console.log(`Pedido ${pedido.id} actualizado a estado: ${newPaymentStatus}`);

                // Si el pago fue aprobado, actualizar el stock de los libros
                if (mpData.status === 'approved') {
                    console.log(`Pago aprobado, actualizando stock para pedido ${pedido.id}`);
                    
                    for (const item of pedido.items) {
                        const libro = item.libro;
                        const nuevaCantidad = libro.stock - item.cantidad;
                        
                        if (nuevaCantidad < 0) {
                            console.warn(`Stock insuficiente para libro ${libro.id} (${libro.nombre}). Stock actual: ${libro.stock}, solicitado: ${item.cantidad}`);
                            // ACA PODRIAMOS CANCELAR EL PEDIDO O HACER UNA DEVOLUCION, PERO CREO QUE ES COMPLEJO
                        } else {
                            await prisma.libro.update({
                                where: { id: libro.id },
                                data: { stock: nuevaCantidad }
                            });
                            console.log(`Stock actualizado para libro ${libro.id} (${libro.nombre}): ${libro.stock} -> ${nuevaCantidad}`);
                        }
                    }
                    
                    console.log(`Stock actualizado exitosamente para todos los libros del pedido ${pedido.id}`);
                }
            } else {
                console.warn('Pago sin external_reference, no se puede procesar');
            }

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ ignored: true });

    } catch (error: unknown) {
        console.error('Error en webhook:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error interno';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}