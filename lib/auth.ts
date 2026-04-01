import { randomUUID } from 'node:crypto';
import { clearSession, createSession, getSessionFromCookie, requireSession } from '@/lib/session';
import { hashPassword, verifyPassword } from '@/lib/password';
import {
  createUserWithOrganization,
  getCurrentMembershipForUser,
  getUserByEmail,
} from '@/lib/repository';

export type SignupInput = {
  name?: string;
  email: string;
  password: string;
  organizationName: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function slugifyOrganizationName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || `org-${randomUUID().slice(0, 8)}`;
}

export async function signup(input: SignupInput) {
  const email = normalizeEmail(input.email);
  const existing = await getUserByEmail(email);
  if (existing) {
    throw new Error('An account with that email already exists.');
  }

  const passwordHash = await hashPassword(input.password);
  const created = await createUserWithOrganization({
    userId: randomUUID(),
    organizationId: randomUUID(),
    membershipId: randomUUID(),
    email,
    name: input.name?.trim() || null,
    passwordHash,
    organizationName: input.organizationName.trim(),
    organizationSlug: slugifyOrganizationName(input.organizationName),
    role: 'owner',
  });

  await createSession(created.user.id, created.organization.id, 'owner');
  return created;
}

export async function login(input: LoginInput) {
  const email = normalizeEmail(input.email);
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid email or password.');
  }

  const membership = await getCurrentMembershipForUser(user.id);
  if (!membership) {
    throw new Error('This account is not assigned to an organization.');
  }

  await createSession(user.id, membership.organizationId, membership.role);
  return {
    user,
    membership,
  };
}

export async function logout() {
  await clearSession();
}

export async function requireAuthContext() {
  const session = await requireSession();
  return {
    userId: session.userId,
    organizationId: session.organizationId,
    membershipRole: session.membershipRole,
  };
}

export async function getCurrentAuthContext() {
  const session = await getSessionFromCookie();
  if (!session) return null;

  return {
    userId: session.userId,
    organizationId: session.organizationId,
    membershipRole: session.membershipRole,
  };
}
