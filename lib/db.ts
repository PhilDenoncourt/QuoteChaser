import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __quoteChaserPrisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __quoteChaserPgPool: Pool | undefined;
}

export function dbEnabled() {
  return true;
}

export function getPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required. Quote Chaser now runs in database-only mode.');
  }

  const pool = global.__quoteChaserPgPool ?? new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  const prisma = global.__quoteChaserPrisma ?? new PrismaClient({
    adapter: new PrismaPg(pool),
  });

  if (process.env.NODE_ENV !== 'production') {
    global.__quoteChaserPgPool = pool;
    global.__quoteChaserPrisma = prisma;
  }

  return prisma;
}
