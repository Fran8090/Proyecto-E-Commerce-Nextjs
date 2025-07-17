import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '9');
    const nombre = searchParams.get('nombre') || '';
    const skip = (page - 1) * limit;

    const where = nombre
      ? { nombre: { contains: nombre, mode: 'insensitive' as const } }
      : {};

    const [libros, total] = await Promise.all([
      prisma.libro.findMany({
        skip,
        take: limit,
        where,
        include: {
          categoria: true
        }
      }),
      prisma.libro.count({ where })
    ]);

    return NextResponse.json({ libros, total });
  } catch (error: Error | unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener los libros' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, autor, img, precio, categoriaId, stock } = body;

    // Validación de campos requeridos
    if (!nombre || !autor || !img || !precio || !categoriaId || stock === undefined) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Validar que la categoría existe
    const categoria = await prisma.categoria.findUnique({
      where: { id: Number(categoriaId) }
    });

    if (!categoria) {
      return NextResponse.json(
        { error: 'Categoría no válida' },
        { status: 400 }
      );
    }

    // Verificar si el libro ya existe
    const existingBook = await prisma.libro.findFirst({
      where: { nombre }
    });

    if (existingBook) {
      return NextResponse.json(
        { error: 'Ya existe un libro con ese nombre' },
        { status: 400 }
      );
    }

    const newBook = await prisma.libro.create({
      data: {
        nombre,
        autor,
        img,
        precio: Number(precio),
        categoriaId: Number(categoriaId),
        stock: Number(stock)
      },
      include: {
        categoria: true
      }
    });

    return NextResponse.json(newBook, { status: 201 });
  } catch (error: Error | unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear el libro' },
      { status: 500 }
    );
  }
} 