import { getCurrentViewer } from '@/lib/auth';
import { AppHeader } from '@/components/app-header';

export async function AppShell({ children }: { children: React.ReactNode }) {
  const viewer = await getCurrentViewer();

  if (!viewer) {
    return <>{children}</>;
  }

  const userLabel = viewer.user.name?.trim() || viewer.user.email;

  return (
    <>
      <AppHeader
        organizationName={viewer.organization.name}
        userLabel={userLabel}
      />
      {children}
    </>
  );
}
