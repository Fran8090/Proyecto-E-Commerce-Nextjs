import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/admin/books - Iniciando...');
    
    const user = await requireAdmin(request);
    if (!user) {
      console.log('Acceso denegado - Usuario no admin');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('Usuario admin verificado, obteniendo libros...');
    const books = await prisma.libro.findMany({
      include: {
        categoria: true
      }
    });

    console.log(`Libros obtenidos: ${books.length}`);
    return NextResponse.json(books);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener los libros' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/admin/books - Iniciando...');
    
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

    const existingBook = await prisma.libro.findFirst({ where: { nombre } });
    if (existingBook) {
      return NextResponse.json({ error: 'Ya existe un libro con ese nombre' }, { status: 400 });
    }

    const newBook = await prisma.libro.create({
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

    console.log('Libro creado exitosamente:', newBook.id);
    return NextResponse.json(newBook);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear el libro' },
      { status: 500 }
    );
  }
} 