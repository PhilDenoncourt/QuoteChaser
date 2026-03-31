import { diffDays, diffDaysUntil, formatShortDate } from '@/lib/date';
import type { Quote, QuoteWithDerived, UrgencyState } from '@/lib/domain';

export const quotesSeed: Quote[] = [
  {
    id: 'QC-1042',
    customerName: 'Martin Family Roof Replacement',
    contactName: 'Holly Martin',
    phone: '(919) 555-0181',
    email: 'holly@example.com',
    jobAddress: 'Raleigh, NC',
    estimateAmount: 18400,
    dateSent: '2026-03-25T10:00:00.000Z',
    status: 'follow_up_due',
    nextFollowUpAt: '2026-03-31T20:00:00.000Z',
    lastContactAt: '2026-03-29T17:00:00.000Z',
    notes: 'Customer asked about financing options.',
    activities: [
      { id: 'A1', quoteId: 'QC-1042', type: 'email', summary: 'Estimate sent to customer.', createdAt: '2026-03-25T10:00:00.000Z' },
      { id: 'A2', quoteId: 'QC-1042', type: 'call', summary: 'Discussed financing question.', createdAt: '2026-03-29T17:00:00.000Z' },
    ],
  },
  {
    id: 'QC-1041',
    customerName: 'Harris Storm Damage Repair',
    contactName: 'James Harris',
    phone: '(919) 555-0142',
    jobAddress: 'Durham, NC',
    estimateAmount: 12650,
    dateSent: '2026-03-22T14:00:00.000Z',
    status: 'at_risk',
    nextFollowUpAt: '2026-03-30T16:00:00.000Z',
    lastContactAt: '2026-03-26T18:00:00.000Z',
    notes: 'Insurance timing may delay decision.',
    activities: [
      { id: 'A3', quoteId: 'QC-1041', type: 'email', summary: 'Estimate sent with storm repair breakdown.', createdAt: '2026-03-22T14:00:00.000Z' },
      { id: 'A4', quoteId: 'QC-1041', type: 'text', summary: 'Checked whether insurance adjuster had replied.', createdAt: '2026-03-26T18:00:00.000Z' },
    ],
  },
  {
    id: 'QC-1040',
    customerName: 'Bluebird Church Roof Patch',
    contactName: 'Evan Brooks',
    email: 'evan@example.org',
    jobAddress: 'Cary, NC',
    estimateAmount: 4300,
    dateSent: '2026-03-29T15:00:00.000Z',
    status: 'sent',
    nextFollowUpAt: '2026-04-01T14:00:00.000Z',
    lastContactAt: '2026-03-29T15:00:00.000Z',
    notes: 'Quick repair. Wants fast turnaround.',
    activities: [
      { id: 'A5', quoteId: 'QC-1040', type: 'email', summary: 'Estimate sent for patch repair.', createdAt: '2026-03-29T15:00:00.000Z' },
    ],
  },
];

export const draftTemplates = [
  {
    title: 'Friendly check-in',
    text: 'Hi {{name}}, just checking in on the estimate we sent over for your roof project. Happy to answer questions or walk through next steps whenever you’re ready.',
  },
  {
    title: 'Financing nudge',
    text: 'Hi {{name}}, wanted to follow up on the roofing estimate and see if it would help to review timeline or financing options together.',
  },
  {
    title: 'At-risk recovery',
    text: 'Hi {{name}}, I didn’t want your estimate to go stale if the project is still active. If you want, I can quickly recap options and next steps.',
  },
];

export function computeUrgency(quote: Quote): UrgencyState {
  if (quote.status === 'at_risk') return 'at_risk';
  if (quote.status === 'won' || quote.status === 'lost') return 'healthy';

  const daysUntil = diffDaysUntil(quote.nextFollowUpAt);
  if (daysUntil === null) return 'healthy';
  if (daysUntil < 0) return 'at_risk';
  if (daysUntil === 0) return 'due_now';
  if (daysUntil <= 1) return 'due_soon';
  return 'healthy';
}

export function getLastTouchLabel(quote: Quote): string {
  if (!quote.lastContactAt) return 'No touches yet';
  const days = diffDays(quote.lastContactAt);
  if (days <= 0) return 'Touched today';
  if (days === 1) return 'Touched yesterday';
  return `Touched ${days} days ago`;
}

export function getNextFollowUpLabel(quote: Quote): string {
  if (!quote.nextFollowUpAt) return 'No follow-up scheduled';
  const daysUntil = diffDaysUntil(quote.nextFollowUpAt);
  const date = formatShortDate(quote.nextFollowUpAt);
  if (daysUntil === null) return date;
  if (daysUntil < 0) return `Overdue since ${date}`;
  if (daysUntil === 0) return `Due today · ${date}`;
  if (daysUntil === 1) return `Due tomorrow · ${date}`;
  return `Due ${date}`;
}

export function withDerived(quote: Quote): QuoteWithDerived {
  return {
    ...quote,
    quoteAgeDays: diffDays(quote.dateSent),
    daysUntilFollowUp: diffDaysUntil(quote.nextFollowUpAt),
    urgency: computeUrgency(quote),
    lastTouchLabel: getLastTouchLabel(quote),
    nextFollowUpLabel: getNextFollowUpLabel(quote),
  };
}

export function getQuotes(): QuoteWithDerived[] {
  return quotesSeed.map(withDerived);
}

export function getQuoteById(id: string): QuoteWithDerived | undefined {
  return getQuotes().find((quote) => quote.id === id);
}

export function getDashboardMetrics(quotes: QuoteWithDerived[]) {
  const activeQuotes = quotes.filter((quote) => !['won', 'lost'].includes(quote.status));
  return {
    activePipelineValue: activeQuotes.reduce((sum, quote) => sum + quote.estimateAmount, 0),
    dueTodayCount: quotes.filter((quote) => quote.urgency === 'due_now').length,
    atRiskCount: quotes.filter((quote) => quote.urgency === 'at_risk').length,
    recentCount: quotes.filter((quote) => quote.quoteAgeDays <= 3).length,
  };
}

export function sortQueue(quotes: QuoteWithDerived[]) {
  const priority = { at_risk: 0, due_now: 1, due_soon: 2, healthy: 3 };
  return [...quotes].sort((a, b) => {
    const byPriority = priority[a.urgency] - priority[b.urgency];
    if (byPriority !== 0) return byPriority;
    return b.estimateAmount - a.estimateAmount;
  });
}
