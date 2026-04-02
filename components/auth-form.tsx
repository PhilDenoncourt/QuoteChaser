'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import type { AuthFormState } from '@/app/auth/actions';

const initialState: AuthFormState = {};

export function AuthForm({
  mode,
  action,
  token,
}: {
  mode: 'login' | 'signup' | 'forgot-password' | 'reset-password';
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  token?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const values = state.values ?? {};
  const isSignup = mode === 'signup';
  const isLogin = mode === 'login';
  const isForgotPassword = mode === 'forgot-password';
  const isResetPassword = mode === 'reset-password';

  return (
    <form action={formAction} className="form-stack" style={{ marginTop: 16 }}>
      {isResetPassword ? <input type="hidden" name="token" value={token ?? values.token ?? ''} /> : null}

      {isSignup ? (
        <label>
          <div className="small">Your name</div>
          <input className="input" name="name" defaultValue={values.name ?? ''} placeholder="Phil" />
        </label>
      ) : null}

      {isSignup ? (
        <label>
          <div className="small">Company name</div>
          <input className="input" name="organizationName" defaultValue={values.organizationName ?? ''} placeholder="Acme Roofing" />
        </label>
      ) : null}

      {!isResetPassword ? (
        <label>
          <div className="small">Email</div>
          <input className="input" name="email" type="email" defaultValue={values.email ?? ''} placeholder="you@example.com" />
        </label>
      ) : null}

      {!isForgotPassword ? (
        <label>
          <div className="small">Password</div>
          <input className="input" name="password" type="password" defaultValue={values.password ?? ''} placeholder={isSignup || isResetPassword ? 'At least 8 characters' : 'Your password'} />
        </label>
      ) : null}

      {isResetPassword ? (
        <label>
          <div className="small">Confirm password</div>
          <input className="input" name="confirmPassword" type="password" defaultValue={values.confirmPassword ?? ''} placeholder="Repeat your new password" />
        </label>
      ) : null}

      {state.error ? <div className="error-text">{state.error}</div> : null}
      {state.message ? <div className="small" style={{ color: 'var(--primary)', fontWeight: 600 }}>{state.message}</div> : null}

      <div className="actions actions-stack-mobile submit-row">
        <button className="button" type="submit" disabled={pending}>
          {pending
            ? isSignup
              ? 'Creating account…'
              : isLogin
                ? 'Signing in…'
                : isForgotPassword
                  ? 'Preparing reset…'
                  : 'Resetting password…'
            : isSignup
              ? 'Create account'
              : isLogin
                ? 'Sign in'
                : isForgotPassword
                  ? 'Send reset link'
                  : 'Reset password'}
        </button>
      </div>

      <div className="small" style={{ marginTop: 4 }}>
        {isSignup ? (
          <>
            Already have an account? <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
          </>
        ) : isLogin ? (
          <>
            Need an account? <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create one</Link>
            {' · '}
            <Link href="/forgot-password" style={{ color: 'var(--primary)', fontWeight: 600 }}>Forgot password?</Link>
          </>
        ) : (
          <>
            Back to <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>sign in</Link>
          </>
        )}
      </div>
    </form>
  );
}
