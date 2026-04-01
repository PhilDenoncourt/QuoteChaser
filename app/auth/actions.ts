'use server';

import { redirect } from 'next/navigation';
import { login, signup } from '@/lib/auth';

export type AuthFormState = {
  error?: string;
  values?: Record<string, string>;
};

function valuesFromFormData(formData: FormData) {
  return Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, String(value)]));
}

export async function signupAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const organizationName = String(formData.get('organizationName') ?? '').trim();

  if (!email || !password || !organizationName) {
    return {
      error: 'Name is optional, but email, password, and company name are required.',
      values: valuesFromFormData(formData),
    };
  }

  if (password.length < 8) {
    return {
      error: 'Password must be at least 8 characters long.',
      values: valuesFromFormData(formData),
    };
  }

  try {
    await signup({
      name,
      email,
      password,
      organizationName,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unable to create account.',
      values: valuesFromFormData(formData),
    };
  }

  redirect('/');
}

export async function loginAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return {
      error: 'Email and password are required.',
      values: valuesFromFormData(formData),
    };
  }

  try {
    await login({ email, password });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unable to sign in.',
      values: valuesFromFormData(formData),
    };
  }

  redirect('/');
}
