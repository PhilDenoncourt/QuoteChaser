import type { UrgencyState } from '@/lib/domain';

export function UrgencyBadge({ urgency }: { urgency: UrgencyState }) {
  const cls = urgency === 'at_risk' ? 'danger' : urgency === 'due_now' || urgency === 'due_soon' ? 'warning' : 'ok';
  const label = urgency.replace(/_/g, ' ');
  return <span className={`badge ${cls}`}>{label}</span>;
}
