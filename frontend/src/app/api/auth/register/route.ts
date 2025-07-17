import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';


interface ErrorWithMessage {
  message: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

export async function POST(request: Request) {
  try {
    const { nombre, apellido, email, password } = await request.json();

    if (!nombre || !apellido || !email || !password) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'El formato del email no es válido' },
        { status: 400 }
      );
    }

    // Validar longitud de la contraseña
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        nombre,
        apellido,
        email,
        password: hashedPassword,
        role: 'user' 
      }
    });

    
    const { id, nombre: userName, apellido: userApellido, email: userEmail, role: userRole, createdAt, updatedAt } = user;
    return NextResponse.json({ 
      id, 
      nombre: userName, 
      apellido: userApellido, 
      email: userEmail, 
      role: userRole, 
      createdAt, 
      updatedAt 
    }, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = isErrorWithMessage(error) ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 