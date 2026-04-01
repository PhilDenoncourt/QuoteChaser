import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __quoteChaserPrisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __quoteChaserPgPool: Pool | undefined;
}

function normalizeDatabaseUrl(connectionString: string) {
  const url = new URL(connectionString);

  if (!url.searchParams.has('sslmode')) {
    url.searchParams.set('sslmode', 'require');
  }

  return url.toString();
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

  const normalizedConnectionString = normalizeDatabaseUrl(connectionString);
  const pool = global.__quoteChaserPgPool ?? new Pool({
    connectionString: normalizedConnectionString,
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
