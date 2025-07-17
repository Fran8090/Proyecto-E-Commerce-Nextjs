import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/admin/pedidos - Iniciando...');
    
    const user = await requireAdmin(request);
    if (!user) {
      console.log('Acceso denegado - Usuario no admin');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('Usuario admin verificado, obteniendo pedidos...');
    const pedidos = await prisma.pedido.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nombre: true
          }
        },
        items: {
          include: {
            libro: {
              include: {
                categoria: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Pedidos obtenidos: ${pedidos.length}`);
    return NextResponse.json(pedidos);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener los pedidos' },
      { status: 500 }
    );
  }
} 