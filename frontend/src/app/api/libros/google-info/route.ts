import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nombre = searchParams.get('nombre');

    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre del libro es requerido' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(nombre)}&maxResults=1`
    );

    if (!response.ok) {
      throw new Error('Error al obtener información de Google Books');
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: 'No se encontró información adicional para este libro en Google Books' },
        { status: 404 }
      );
    }

    const bookInfo = data.items[0].volumeInfo;
    const info = {
      description: bookInfo.description || 'No hay descripción disponible para este libro.',
      averageRating: bookInfo.averageRating || 0,
      ratingsCount: bookInfo.ratingsCount || 0
    };

    // Si no hay descripción ni ratings, devolver un mensaje específico
    if (!bookInfo.description && !bookInfo.averageRating) {
      return NextResponse.json({
        error: 'No hay información adicional disponible para este libro en Google Books',
        ...info
      });
    }

    return NextResponse.json(info);
  } catch (error: Error | unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener información adicional' },
      { status: 500 }
    );
  }
} 