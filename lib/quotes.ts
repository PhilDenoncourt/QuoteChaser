import { promises as fs } from 'node:fs';
import path from 'node:path';
import { diffDays, diffDaysUntil, formatShortDate } from '@/lib/date';
import type { Quote, QuoteStatus, QuoteWithDerived, UrgencyState } from '@/lib/domain';

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

const quotesFilePath = path.join(process.cwd(), 'data', 'quotes.json');

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

async function readQuotes(): Promise<Quote[]> {
  const raw = await fs.readFile(quotesFilePath, 'utf8');
  return JSON.parse(raw) as Quote[];
}

async function writeQuotes(quotes: Quote[]) {
  await fs.writeFile(quotesFilePath, JSON.stringify(quotes, null, 2) + '\n', 'utf8');
}

export async function getQuotes(): Promise<QuoteWithDerived[]> {
  const quotes = await readQuotes();
  return quotes.map(withDerived);
}

export async function getQuoteById(id: string): Promise<QuoteWithDerived | undefined> {
  const quotes = await getQuotes();
  return quotes.find((quote) => quote.id === id);
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

export type QuoteInput = {
  customerName: string;
  contactName?: string;
  phone?: string;
  email?: string;
  jobAddress: string;
  estimateAmount: number;
  dateSent: string;
  notes?: string;
  status?: QuoteStatus;
};

export type QuoteValidationResult = {
  fieldErrors: Partial<Record<'customerName' | 'contact' | 'jobAddress' | 'estimateAmount' | 'dateSent', string>>;
};

export function validateQuoteInput(input: QuoteInput): QuoteValidationResult {
  const fieldErrors: QuoteValidationResult['fieldErrors'] = {};

  if (!input.customerName.trim()) fieldErrors.customerName = 'Customer name is required.';
  if (!input.phone?.trim() && !input.email?.trim()) fieldErrors.contact = 'Phone or email is required.';
  if (!input.jobAddress.trim()) fieldErrors.jobAddress = 'Job address is required.';
  if (!Number.isFinite(input.estimateAmount) || input.estimateAmount <= 0) fieldErrors.estimateAmount = 'Estimate amount must be greater than zero.';
  if (!input.dateSent.trim()) fieldErrors.dateSent = 'Date sent is required.';

  return { fieldErrors };
}

export function hasValidationErrors(result: QuoteValidationResult) {
  return Object.keys(result.fieldErrors).length > 0;
}

export function calculateDefaultFollowUp(dateSent: string) {
  const sent = new Date(dateSent);
  sent.setUTCDate(sent.getUTCDate() + 2);
  return sent.toISOString();
}

function nextQuoteId(quotes: Quote[]) {
  const nums = quotes
    .map((quote) => Number.parseInt(quote.id.replace('QC-', ''), 10))
    .filter((num) => Number.isFinite(num));
  const max = nums.length ? Math.max(...nums) : 1039;
  return `QC-${max + 1}`;
}

function nextActivityId(quotes: Quote[]) {
  const nums = quotes
    .flatMap((quote) => quote.activities)
    .map((activity) => Number.parseInt(activity.id.replace('A', ''), 10))
    .filter((num) => Number.isFinite(num));
  const max = nums.length ? Math.max(...nums) : 0;
  return `A${max + 1}`;
}

export async function createQuote(input: QuoteInput) {
  const quotes = await readQuotes();
  const createdAt = new Date(`${input.dateSent}T12:00:00.000Z`).toISOString();
  const id = nextQuoteId(quotes);
  const activityId = nextActivityId(quotes);

  const quote: Quote = {
    id,
    customerName: input.customerName.trim(),
    contactName: input.contactName?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    email: input.email?.trim() || undefined,
    jobAddress: input.jobAddress.trim(),
    estimateAmount: input.estimateAmount,
    dateSent: createdAt,
    status: input.status ?? 'sent',
    nextFollowUpAt: calculateDefaultFollowUp(createdAt),
    lastContactAt: createdAt,
    notes: input.notes?.trim() || undefined,
    activities: [
      {
        id: activityId,
        quoteId: id,
        type: 'email',
        summary: 'Quote logged in Quote Chaser.',
        createdAt,
      },
    ],
  };

  quotes.unshift(quote);
  await writeQuotes(quotes);
  return quote;
}

export async function updateQuote(id: string, input: QuoteInput) {
  const quotes = await readQuotes();
  const index = quotes.findIndex((quote) => quote.id === id);
  if (index === -1) return null;

  const existing = quotes[index];
  const normalizedDate = new Date(`${input.dateSent}T12:00:00.000Z`).toISOString();
  const nextFollowUpAt = existing.nextFollowUpAt ?? calculateDefaultFollowUp(normalizedDate);

  quotes[index] = {
    ...existing,
    customerName: input.customerName.trim(),
    contactName: input.contactName?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    email: input.email?.trim() || undefined,
    jobAddress: input.jobAddress.trim(),
    estimateAmount: input.estimateAmount,
    dateSent: normalizedDate,
    notes: input.notes?.trim() || undefined,
    nextFollowUpAt,
    status: input.status ?? existing.status,
    activities: [
      ...existing.activities,
      {
        id: nextActivityId(quotes),
        quoteId: id,
        type: 'note',
        summary: 'Quote details updated.',
        createdAt: new Date().toISOString(),
      },
    ],
  };

  await writeQuotes(quotes);
  return quotes[index];
}
