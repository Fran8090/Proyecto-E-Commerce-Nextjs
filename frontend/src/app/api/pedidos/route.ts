import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth-utils';

interface CartItem {
  id: number;
  quantity: number;
  precio: number;
}

interface PedidoBody {
  items: CartItem[];
  total: number;
  paymentId?: string; 
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const pedidos = await prisma.pedido.findMany({
      where: {
        userId: parseInt(user.id)
      },
      include: {
        items: {
          include: {
            libro: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(pedidos);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener pedidos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json() as PedidoBody;
    const { items, total, paymentId } = body;

    // Verificar el stock de cada libro
    for (const item of items) {
      const libro = await prisma.libro.findUnique({
        where: { id: item.id }
      });

      if (!libro) {
        return NextResponse.json(
          { error: `El libro con ID ${item.id} no existe` },
          { status: 400 }
        );
      }

      if (libro.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para el libro "${libro.nombre}". Stock disponible: ${libro.stock}, Cantidad solicitada: ${item.quantity}` },
          { status: 400 }
        );
      }
    }

    const pedido = await prisma.pedido.create({
      data: {
        userId: parseInt(user.id),
        total,
        paymentStatus: 'PENDING',
        paymentId: paymentId || null,
        items: {
          create: items.map((item: CartItem) => ({
            libroId: item.id,
            cantidad: item.quantity,
            precio: item.precio
          }))
        }
      },
      include: {
        items: {
          include: {
            libro: true
          }
        }
      }
    });

    return NextResponse.json(pedido, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear pedido' },
      { status: 500 }
    );
  }
} 