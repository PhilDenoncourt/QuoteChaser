import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  // eslint-disable-next-line no-var
  var __quoteChaserPrisma: PrismaClient | undefined;
}

export function dbEnabled() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPrismaClient() {
  if (!dbEnabled()) {
    throw new Error('DATABASE_URL is not configured. Prisma client should only be used when database mode is enabled.');
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured.');
  }

  const prisma = global.__quoteChaserPrisma ?? new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  if (process.env.NODE_ENV !== 'production') {
    global.__quoteChaserPrisma = prisma;
  }

  return prisma;
}
