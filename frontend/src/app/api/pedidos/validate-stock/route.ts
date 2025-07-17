import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ValidationResult {
  id: number;
  nombre: string;
  stock: number;
  requested: number;
  available: number;
  valid: boolean;
  error: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json();
    
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ 
        error: 'Items inválidos',
        valid: false 
      }, { status: 400 });
    }

    const validationResults: ValidationResult[] = [];
    let hasInsufficientStock = false;

    for (const item of items) {
      const libro = await prisma.libro.findUnique({
        where: { id: item.id },
        select: { id: true, nombre: true, stock: true }
      });

      if (!libro) {
        validationResults.push({
          id: item.id,
          nombre: 'Libro no encontrado',
          stock: 0,
          requested: item.quantity,
          available: 0,
          valid: false,
          error: 'Libro no encontrado'
        });
        hasInsufficientStock = true;
        continue;
      }

      const isValid = libro.stock >= item.quantity;
      
      if (!isValid) {
        hasInsufficientStock = true;
      }

      validationResults.push({
        id: libro.id,
        nombre: libro.nombre,
        stock: libro.stock,
        requested: item.quantity,
        available: libro.stock,
        valid: isValid,
        error: isValid ? null : `Stock insuficiente. Disponible: ${libro.stock}, Solicitado: ${item.quantity}`
      });
    }

    return NextResponse.json({
      valid: !hasInsufficientStock,
      results: validationResults,
      message: hasInsufficientStock 
        ? 'Algunos productos no tienen stock suficiente' 
        : 'Stock válido para todos los productos'
    });

  } catch {
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        valid: false 
      }, 
      { status: 500 }
    );
  }
} 