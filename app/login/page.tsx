import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import { loginAction } from '@/app/auth/actions';
import { getCurrentAuthContext } from '@/lib/auth';

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ reset?: string }>;
}) {
  const auth = await getCurrentAuthContext();
  if (auth) {
    redirect('/');
  }

  const params = await searchParams;
  const resetSucceeded = params?.reset === 'success';

  return (
    <main className="container mobile-shell" style={{ maxWidth: 560 }}>
      <section className="card">
        <p className="small">Quote Chaser</p>
        <h1 style={{ marginTop: 0 }}>Sign in</h1>
        <p className="small">Access your quote pipeline and follow-up queue.</p>
        {resetSucceeded ? (
          <p className="small" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Your password was reset. Sign in with the new password.
          </p>
        ) : null}
        <AuthForm mode="login" action={loginAction} />
      </section>
    </main>
  );
}
