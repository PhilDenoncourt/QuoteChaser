import { redirect } from 'next/navigation';
import { requestPasswordResetAction } from '@/app/auth/actions';
import { AuthForm } from '@/components/auth-form';
import { getCurrentAuthContext } from '@/lib/auth';

export default async function ForgotPasswordPage() {
  const auth = await getCurrentAuthContext();
  if (auth) {
    redirect('/');
  }

  return (
    <main className="container mobile-shell" style={{ maxWidth: 560 }}>
      <section className="card">
        <p className="small">Quote Chaser</p>
        <h1 style={{ marginTop: 0 }}>Forgot password</h1>
        <p className="small">
          Enter your email and we&apos;ll prepare a password reset link.
        </p>
        <AuthForm mode="forgot-password" action={requestPasswordResetAction} />
      </section>
    </main>
  );
}
