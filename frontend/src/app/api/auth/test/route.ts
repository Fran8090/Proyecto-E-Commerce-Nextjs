import { NextResponse, NextRequest } from 'next/server';
import { verifyAuth, requireAdmin } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/auth/test - Iniciando...');
    
    // Probar autenticación básica
    const user = await verifyAuth(request);
    if (!user) {
      console.log('Usuario no autenticado');
      return NextResponse.json({ 
        authenticated: false, 
        message: 'Usuario no autenticado' 
      }, { status: 401 });
    }

    // Probar si es admin
    const adminUser = await requireAdmin(request);
    const isAdmin = !!adminUser;

    console.log('Test de autenticación completado:', {
      userId: user.id,
      email: user.email,
      role: user.role,
      isAdmin
    });

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      isAdmin,
      message: isAdmin ? 'Usuario admin verificado' : 'Usuario autenticado pero no es admin'
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { 
        authenticated: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      },
      { status: 500 }
    );
  }
} 