import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { appConfig } from '@/lib/config';
import { hashPassword } from '@/lib/password';
import {
  createPasswordResetTokenRecord,
  deleteExpiredPasswordResetTokens,
  deleteSessionsForUser,
  getPasswordResetTokenByHash,
  getUserByEmail,
  markPasswordResetTokenUsed,
  updateUserPassword,
} from '@/lib/repository';

function hashResetToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function generateResetToken() {
  return randomBytes(32).toString('hex');
}

export function buildPasswordResetUrl(token: string) {
  const baseUrl = appConfig.auth.appBaseUrl.trim();
  const path = `/reset-password?token=${encodeURIComponent(token)}`;

  if (!baseUrl) {
    return path;
  }

  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

export async function createPasswordResetRequest(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await getUserByEmail(normalizedEmail);

  await deleteExpiredPasswordResetTokens();

  if (!user) {
    return {
      accepted: true,
      emailSent: false,
      resetUrl: null as string | null,
    };
  }

  const token = generateResetToken();
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + appConfig.auth.resetTokenTtlMinutes * 60 * 1000);

  await createPasswordResetTokenRecord({
    id: randomUUID(),
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  return {
    accepted: true,
    emailSent: false,
    resetUrl: buildPasswordResetUrl(token),
  };
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  const tokenHash = hashResetToken(token);
  const record = await getPasswordResetTokenByHash(tokenHash);

  if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
    throw new Error('This password reset link is invalid or has expired.');
  }

  const passwordHash = await hashPassword(newPassword);

  await updateUserPassword(record.userId, passwordHash);
  await markPasswordResetTokenUsed(record.id);
  await deleteSessionsForUser(record.userId);
  await deleteExpiredPasswordResetTokens();
}
