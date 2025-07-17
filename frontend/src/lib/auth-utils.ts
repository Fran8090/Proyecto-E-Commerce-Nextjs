import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface DecodedToken {
  sub?: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

export async function verifyAuth(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    
    const sessionToken = request.cookies.get('next-auth.session-token')?.value;
    
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    
    if (!token && sessionToken) {
      try {
        const decoded = jwt.decode(sessionToken) as DecodedToken;
        
        if (decoded && decoded.sub) {
          const user = await prisma.user.findUnique({
            where: { id: parseInt(decoded.sub) },
            select: {
              id: true,
              email: true,
              nombre: true,
              role: true
            }
          });
          
          if (user) {
            return {
              id: user.id.toString(),
              email: user.email,
              name: user.nombre,
              role: user.role
            };
          }
        }
      } catch {
      }
    }

    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const userId = authHeader.replace('Bearer ', '');
        
        const user = await prisma.user.findUnique({
          where: { id: parseInt(userId) },
          select: {
            id: true,
            email: true,
            nombre: true,
            role: true
          }
        });
        
        if (user) {
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.nombre,
            role: user.role
          };
        }
      }
      
      return null;
    }

    if (!token.sub) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(token.sub) },
      select: {
        id: true,
        email: true,
        nombre: true,
        role: true
      }
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id.toString(),
      email: user.email,
      name: user.nombre,
      role: user.role
    };
  } catch {
    return null;
  }
}

export async function requireAdmin(request: NextRequest): Promise<AuthenticatedUser | null> {
  const user = await verifyAuth(request);
  
  if (!user) {
    return null;
  }

  if (user.role !== 'admin') {
    return null;
  }

  return user;
} 