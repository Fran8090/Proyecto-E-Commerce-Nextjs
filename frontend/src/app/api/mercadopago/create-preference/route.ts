import { MercadoPagoConfig, Preference } from 'mercadopago';
import { NextRequest, NextResponse } from 'next/server';

interface CartItem {
  id: number;
  nombre: string;
  precio: number;
  quantity: number;
}

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!
});
const preference = new Preference(client);

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items inválidos' }, { status: 400 });
    }

    // Validar que cada item tenga los campos requeridos
    const invalidItems = items.filter((item: CartItem) => {
      const isValid = item && 
        typeof item.id !== 'undefined' && 
        item.nombre && 
        typeof item.precio !== 'undefined' && 
        typeof item.quantity !== 'undefined';
      
      if (!isValid) {
        console.error('Item inválido:', {
          id: item?.id,
          nombre: item?.nombre,
          precio: item?.precio,
          quantity: item?.quantity,
          item: item
        });
      }
      
      return !isValid;
    });

    if (invalidItems.length > 0) {
      console.error('Items inválidos encontrados:', JSON.stringify(invalidItems, null, 2));
      return NextResponse.json({ 
        error: 'Algunos items no tienen todos los campos requeridos',
        invalidItems,
        details: invalidItems.map(item => ({
          id: item?.id,
          nombre: item?.nombre,
          precio: item?.precio,
          quantity: item?.quantity
        }))
      }, { status: 400 });
    }

    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXTAUTH_URL 
      : process.env.NGROK_URL || 'http://localhost:3000';

    // Generar external_reference única
    const externalReference = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const request = {
      body: {
        items: items.map((it: CartItem) => ({
          id: String(it.id),
          title: it.nombre,
          unit_price: Number(it.precio),
          quantity: Number(it.quantity),
          currency_id: 'ARS',
        })),
        external_reference: externalReference,
        back_urls: {
          success: `${baseUrl}/payment/success`,
          failure: `${baseUrl}/payment/failure`,
          pending: `${baseUrl}/payment/pending`
        },
        auto_return: 'approved'
      }
    };

    const response = await preference.create(request);
    console.log('preference_id devuelto:', response.id, 'tipo:', typeof response.id);
    
    return NextResponse.json({
      init_point: response.init_point,
      preference_id: response.id,
      external_reference: externalReference
    });
  } catch (error: Error | unknown) {
    console.error('[MP PREF ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear la preferencia de pago' },
      { status: 500 }
    );
  }
}