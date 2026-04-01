import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { deleteSessionByTokenHash, getSessionByTokenHash, upsertSessionRecord } from '@/lib/repository';
import { SESSION_COOKIE_NAME } from '@/lib/auth-config';

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export type SessionContext = {
  sessionId: string;
  userId: string;
  organizationId: string;
  membershipRole: 'owner' | 'member';
  expiresAt: Date;
};

function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function generateSessionToken() {
  return randomBytes(32).toString('hex');
}

export async function createSession(userId: string, organizationId: string, membershipRole: 'owner' | 'member') {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await upsertSessionRecord({
    id: randomUUID(),
    userId,
    organizationId,
    membershipRole,
    tokenHash,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/',
  });

  return token;
}

export async function getSessionFromCookie(): Promise<SessionContext | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashSessionToken(token);
  const session = await getSessionByTokenHash(tokenHash);
  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await deleteSessionByTokenHash(tokenHash);
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  return {
    sessionId: session.id,
    userId: session.userId,
    organizationId: session.organizationId,
    membershipRole: session.membershipRole,
    expiresAt: session.expiresAt,
  };
}

export async function requireSession(): Promise<SessionContext> {
  const session = await getSessionFromCookie();
  if (!session) {
    throw new Error('Authentication required.');
  }

  return session;
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await deleteSessionByTokenHash(hashSessionToken(token));
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}
