'use server';

import { redirect } from 'next/navigation';
import { login, signup } from '@/lib/auth';
import { createPasswordResetRequest, resetPasswordWithToken } from '@/lib/password-reset';

export type AuthFormState = {
  error?: string;
  message?: string;
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

export async function requestPasswordResetAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get('email') ?? '').trim();

  if (!email) {
    return {
      error: 'Email is required.',
      values: valuesFromFormData(formData),
    };
  }

  try {
    const result = await createPasswordResetRequest(email);
    return {
      message: result.resetUrl
        ? `If that account exists, a reset link is ready: ${result.resetUrl}`
        : 'If that account exists, a password reset link has been prepared.',
      values: { email },
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unable to start password reset.',
      values: valuesFromFormData(formData),
    };
  }
}

export async function resetPasswordAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const token = String(formData.get('token') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (!token) {
    return {
      error: 'Reset token is missing.',
    };
  }

  if (!password || !confirmPassword) {
    return {
      error: 'Both password fields are required.',
      values: valuesFromFormData(formData),
    };
  }

  if (password.length < 8) {
    return {
      error: 'Password must be at least 8 characters long.',
      values: valuesFromFormData(formData),
    };
  }

  if (password !== confirmPassword) {
    return {
      error: 'Passwords do not match.',
      values: valuesFromFormData(formData),
    };
  }

  try {
    await resetPasswordWithToken(token, password);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unable to reset password.',
      values: { token },
    };
  }

  redirect('/login?reset=success');
}
