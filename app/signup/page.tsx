import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import { signupAction } from '@/app/auth/actions';
import { getCurrentAuthContext } from '@/lib/auth';

export default async function SignupPage() {
  const auth = await getCurrentAuthContext();
  if (auth) {
    redirect('/');
  }

  return (
    <main className="container mobile-shell" style={{ maxWidth: 560 }}>
      <section className="card">
        <p className="small">Quote Chaser</p>
        <h1 style={{ marginTop: 0 }}>Create your company account</h1>
        <p className="small">Start tracking quotes inside your own private workspace.</p>
        <AuthForm mode="signup" action={signupAction} />
      </section>
    </main>
  );
}
