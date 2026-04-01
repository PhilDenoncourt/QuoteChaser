import type { DraftSuggestion, DraftTone, QuoteWithDerived } from '@/lib/domain';

function firstNameFromQuote(quote: QuoteWithDerived) {
  const source = quote.contactName?.trim() || quote.customerName.trim();
  const [first] = source.split(/\s+/);
  return first || 'there';
}

function contactMethodLabel(quote: QuoteWithDerived) {
  if (quote.phone && quote.email) return 'call or email';
  if (quote.phone) return 'call or text';
  if (quote.email) return 'email';
  return 'connect';
}

function estimateLabel(quote: QuoteWithDerived) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(quote.estimateAmount);
}

function ageContext(quote: QuoteWithDerived) {
  if (quote.quoteAgeDays <= 1) return 'We sent your roofing estimate recently';
  if (quote.quoteAgeDays <= 7) return `Your roofing estimate has been out for ${quote.quoteAgeDays} days`;
  return `Your roofing estimate has been open for ${quote.quoteAgeDays} days`;
}

function urgencyContext(quote: QuoteWithDerived) {
  if (quote.urgency === 'at_risk') return 'and I did not want it to go cold if the project is still active';
  if (quote.urgency === 'due_now') return 'and wanted to check in while the project is still fresh';
  if (quote.urgency === 'due_soon') return 'and wanted to stay ahead of next steps';
  return 'and wanted to make sure you have what you need to move forward';
}

function notesContext(quote: QuoteWithDerived) {
  if (!quote.notes?.trim()) return '';
  const summary = quote.notes.trim().replace(/\s+/g, ' ');
  if (summary.length <= 120) return ` Context: ${summary}`;
  return ` Context: ${summary.slice(0, 117)}...`;
}

function buildFallbackDraft(quote: QuoteWithDerived, tone: DraftTone): DraftSuggestion {
  const firstName = firstNameFromQuote(quote);
  const amount = estimateLabel(quote);
  const touchTarget = contactMethodLabel(quote);
  const context = `${ageContext(quote)}, ${urgencyContext(quote)}.`;
  const extraContext = notesContext(quote);

  if (tone === 'sms') {
    return {
      tone,
      title: 'Short SMS check-in',
      channel: 'text',
      body: `Hi ${firstName}, just checking in on the ${amount} roofing estimate for ${quote.jobAddress}. ${quote.urgency === 'at_risk' ? 'I did not want it to go stale if the job is still active.' : 'Happy to answer any questions and talk through next steps.'}`,
      rationale: `Short mobile-friendly text for a ${quote.urgency.replace('_', ' ')} quote.${extraContext}`,
      fallbackUsed: true,
    };
  }

  if (tone === 'urgent') {
    return {
      tone,
      title: 'At-risk recovery email',
      channel: 'email',
      subject: `Checking in on your roofing estimate for ${quote.jobAddress}`,
      body: `Hi ${firstName},\n\n${context} I wanted to follow up on the roofing estimate we sent for ${quote.jobAddress}. If the project is still moving, I can quickly walk through the scope, timing, or any questions holding things up.\n\nIf it helps, we can reconnect by ${touchTarget} and get you a clear next step.\n\nThanks,`,
      rationale: `Recovery-oriented draft for quotes that need urgency without sounding pushy.${extraContext}`,
      fallbackUsed: true,
    };
  }

  return {
    tone,
    title: 'Friendly email follow-up',
    channel: 'email',
    subject: `Following up on your roofing estimate`,
    body: `Hi ${firstName},\n\nI wanted to check in on the roofing estimate we sent for ${quote.jobAddress}. We currently have you at ${amount}, and I’m happy to answer questions, review options, or talk through timing whenever you’re ready.\n\nIf you want, I can also give you a quick recap of next steps.\n\nThanks,`,
    rationale: `Simple low-pressure follow-up for an active quote.${extraContext}`,
    fallbackUsed: true,
  };
}

export function generateDraftSuggestions(quote: QuoteWithDerived): DraftSuggestion[] {
  return [
    buildFallbackDraft(quote, 'friendly'),
    buildFallbackDraft(quote, 'urgent'),
    buildFallbackDraft(quote, 'sms'),
  ];
}

export function aiDraftsEnabled() {
  return Boolean(process.env.OPENAI_API_KEY);
}
