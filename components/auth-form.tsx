'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import type { AuthFormState } from '@/app/auth/actions';

const initialState: AuthFormState = {};

export function AuthForm({
  mode,
  action,
}: {
  mode: 'login' | 'signup';
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const values = state.values ?? {};
  const isSignup = mode === 'signup';

  return (
    <form action={formAction} className="form-stack" style={{ marginTop: 16 }}>
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

      <label>
        <div className="small">Email</div>
        <input className="input" name="email" type="email" defaultValue={values.email ?? ''} placeholder="you@example.com" />
      </label>

      <label>
        <div className="small">Password</div>
        <input className="input" name="password" type="password" defaultValue={values.password ?? ''} placeholder={isSignup ? 'At least 8 characters' : 'Your password'} />
      </label>

      {state.error ? <div className="error-text">{state.error}</div> : null}

      <div className="actions actions-stack-mobile submit-row">
        <button className="button" type="submit" disabled={pending}>
          {pending ? (isSignup ? 'Creating account…' : 'Signing in…') : (isSignup ? 'Create account' : 'Sign in')}
        </button>
      </div>

      <div className="small" style={{ marginTop: 4 }}>
        {isSignup ? (
          <>
            Already have an account? <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
          </>
        ) : (
          <>
            Need an account? <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create one</Link>
          </>
        )}
      </div>
    </form>
  );
}
