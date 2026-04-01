import Link from 'next/link';
import { logoutAction } from '@/app/auth/logout-action';

export function AppHeader({
  organizationName,
  userLabel,
}: {
  organizationName: string;
  userLabel: string;
}) {
  return (
    <header className="app-header-wrap">
      <div className="container mobile-shell app-header-inner">
        <div>
          <Link href="/" className="app-header-brand">Quote Chaser</Link>
          <div className="small">{organizationName}</div>
        </div>

        <div className="app-header-meta">
          <div className="small" style={{ textAlign: 'right' }}>{userLabel}</div>
          <form action={logoutAction}>
            <button type="submit" className="button secondary">Log out</button>
          </form>
        </div>
      </div>
    </header>
  );
}
