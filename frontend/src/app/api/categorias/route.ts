import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request);
    if (!user) {
      console.log('Acceso denegado - Usuario no admin');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('Usuario admin verificado, obteniendo categorías...');
    const categorias = await prisma.categoria.findMany();
    console.log(`Categorías obtenidas: ${categorias.length}`);
    return NextResponse.json(categorias);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener las categorías' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin(request);
    if (!user) {
      console.log('Acceso denegado - Usuario no admin');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { nombre } = await request.json();
    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    const existingCategoria = await prisma.categoria.findFirst({ where: { nombre } });
    if (existingCategoria) {
      return NextResponse.json({ error: 'Ya existe una categoría con ese nombre' }, { status: 400 });
    }

    const newCategoria = await prisma.categoria.create({ data: { nombre } });
    console.log('Categoría creada exitosamente:', newCategoria.id);
    return NextResponse.json(newCategoria, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear la categoría' },
      { status: 500 }
    );
  }
} 