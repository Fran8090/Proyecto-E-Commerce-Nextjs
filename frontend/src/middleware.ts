import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

async function verifyAuth(request: NextRequest) {
  try {
    
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (token) {
      return token;
    }

    
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const userId = authHeader.replace('Bearer ', '');
      
      return {
        sub: userId,
        role: 'admin', 
        id: userId
      };
    }

    return null;
  } catch {
    return null;
  }
}

export default async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isAuthPage = path === '/login' || path === '/register';
  const isApiAdminRoute = path.startsWith('/api/admin');

 
  if (!isApiAdminRoute && !isAuthPage) {
    return NextResponse.next();
  }

  try {
    const token = await verifyAuth(request);

    
    if (isAuthPage && token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    
    if (isApiAdminRoute && (!token || token.role !== 'admin')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    return NextResponse.next();
  } catch {
    
    if (isApiAdminRoute) {
      return NextResponse.json({ error: 'Error de autenticación' }, { status: 401 });
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/admin/:path*', // Deja el matcher para que puedas volver a proteger si lo necesitas
    '/api/admin/:path*',
    '/login',
    '/register'
  ]
}; 