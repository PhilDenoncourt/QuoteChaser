import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import { loginAction } from '@/app/auth/actions';
import { getCurrentAuthContext } from '@/lib/auth';

export default async function LoginPage() {
  const auth = await getCurrentAuthContext();
  if (auth) {
    redirect('/');
  }

  return (
    <main className="container mobile-shell" style={{ maxWidth: 560 }}>
      <section className="card">
        <p className="small">Quote Chaser</p>
        <h1 style={{ marginTop: 0 }}>Sign in</h1>
        <p className="small">Access your quote pipeline and follow-up queue.</p>
        <AuthForm mode="login" action={loginAction} />
      </section>
    </main>
  );
}
