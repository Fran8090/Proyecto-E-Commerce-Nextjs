import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});


prisma.$connect()
  .then(() => {
    // console.log('Conexión a la base de datos establecida');
  })
  .catch(() => {
    // console.error('Error al conectar con la base de datos:', error);
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma; 