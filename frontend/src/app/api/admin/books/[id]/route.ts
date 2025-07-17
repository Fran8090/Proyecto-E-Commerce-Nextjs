import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr);

  try {
    const user = await requireAdmin(request);
    if (!user) {
      console.log('Acceso denegado - Usuario no admin');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { nombre, autor, precio, categoriaId, stock, img } = await request.json();
    if (!nombre || !autor || !precio || !categoriaId || stock === undefined || !img) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }

    const categoria = await prisma.categoria.findUnique({ where: { id: Number(categoriaId) } });
    if (!categoria) {
      return NextResponse.json({ error: 'Categoría no válida' }, { status: 400 });
    }

    const existingBook = await prisma.libro.findFirst({ 
      where: { 
        nombre,
        id: { not: id }
      } 
    });
    if (existingBook) {
      return NextResponse.json({ error: 'Ya existe un libro con ese nombre' }, { status: 400 });
    }

    const updatedBook = await prisma.libro.update({
      where: { id },
      data: {
        nombre,
        autor,
        precio: Number(precio),
        categoriaId: Number(categoriaId),
        stock: Number(stock),
        img
      },
      include: { categoria: true }
    });

    console.log('Libro actualizado exitosamente:', updatedBook.id);
    return NextResponse.json(updatedBook);
  } catch (error: unknown) {
    console.error('Error al actualizar libro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al actualizar el libro' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr);

  try {
    const user = await requireAdmin(request);
    if (!user) {
      console.log('Acceso denegado - Usuario no admin');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar si el libro existe
    const book = await prisma.libro.findUnique({
      where: { id },
      include: {
        pedidoItems: true
      }
    });

    if (!book) {
      return NextResponse.json(
        { error: 'El libro no existe' },
        { status: 404 }
      );
    }

    // Verificar si el libro está en algún pedido
    if (book.pedidoItems && book.pedidoItems.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el libro porque está asociado a pedidos' },
        { status: 400 }
      );
    }

    // Eliminar el libro
    await prisma.libro.delete({
      where: { id }
    });

    console.log('Libro eliminado exitosamente:', id);
    return NextResponse.json({ message: 'Libro eliminado correctamente' });
  } catch (error: unknown) {
    console.error('Error al eliminar libro:', error);
    if (error instanceof Error && 'code' in error && error.code === 'P2003') {
      return NextResponse.json(
        { error: 'No se puede eliminar el libro porque está asociado a pedidos' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al eliminar el libro' },
      { status: 500 }
    );
  }
}

