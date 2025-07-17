import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nombre = searchParams.get('nombre');
    const autor = searchParams.get('autor');

    if (!nombre || !autor) {
      return NextResponse.json(
        { error: 'El nombre y autor del libro son requeridos' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'No se encontró la API key de Gemini en el servidor' },
        { status: 500 }
      );
    }

    // Obtener todos los libros disponibles
    const libros = await prisma.libro.findMany({ select: { nombre: true, autor: true } });
    const listaLibros = libros.map(l => `"${l.nombre}" de ${l.autor}`).join(', ');

    const prompt = `Eres un vendedor experto de libros. Escribe un comentario persuasivo y entusiasta para convencer a alguien de comprar el libro "${nombre}" escrito por ${autor} en 150 palabras aproximadamente. Además, sugiere un libro similar de la tienda que también podría gustarle. Los libros disponibles en la tienda son: ${listaLibros}. Usa un tono amigable y motivador, y resalta por qué este libro es una gran elección.`;

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Error al generar comentario con Gemini');
    }

    const data = await response.json();
    const comentario = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'No se pudo generar un comentario en este momento.';

    return NextResponse.json({ comentario });
  } catch (error) {
    const message = typeof error === 'object' && error && 'message' in error ? (error as { message: string }).message : 'Error al generar comentario con Gemini';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
} 