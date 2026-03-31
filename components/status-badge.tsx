import type { QuoteStatus } from '@/lib/domain';

export function StatusBadge({ status }: { status: QuoteStatus }) {
  const cls = status === 'at_risk' || status === 'lost' ? 'danger' : status === 'follow_up_due' ? 'warning' : 'ok';
  const label = status.replace(/_/g, ' ');
  return <span className={`badge ${cls}`}>{label}</span>;
}
