import { QuoteCardList } from '@/components/quote-card-list';
import type { QuoteWithDerived, UrgencyState } from '@/lib/domain';

const labels: Record<UrgencyState, { title: string; subtitle: string }> = {
  at_risk: {
    title: 'At-risk quotes',
    subtitle: 'These quotes are slipping or overdue and need attention first.',
  },
  due_now: {
    title: 'Due now',
    subtitle: 'Quotes that should be touched today.',
  },
  due_soon: {
    title: 'Due soon',
    subtitle: 'Quotes that are coming up next.',
  },
  healthy: {
    title: 'Healthy quotes',
    subtitle: 'Active quotes that are still on track.',
  },
};

export function QueueSection({ urgency, quotes }: { urgency: UrgencyState; quotes: QuoteWithDerived[] }) {
  if (!quotes.length) return null;
  const label = labels[urgency];
  return <QuoteCardList quotes={quotes} title={label.title} subtitle={label.subtitle} compact />;
}
