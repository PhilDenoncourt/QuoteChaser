import { redirect } from 'next/navigation';
import { resetPasswordAction } from '@/app/auth/actions';
import { AuthForm } from '@/components/auth-form';
import { getCurrentAuthContext } from '@/lib/auth';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const auth = await getCurrentAuthContext();
  if (auth) {
    redirect('/');
  }

  const params = await searchParams;
  const token = params?.token?.trim() ?? '';

  return (
    <main className="container mobile-shell" style={{ maxWidth: 560 }}>
      <section className="card">
        <p className="small">Quote Chaser</p>
        <h1 style={{ marginTop: 0 }}>Reset password</h1>
        <p className="small">Choose a new password for your account.</p>
        {token ? (
          <AuthForm mode="reset-password" action={resetPasswordAction} token={token} />
        ) : (
          <div className="error-text">Reset token is missing. Request a new reset link.</div>
        )}
      </section>
    </main>
  );
}
