import OpenAI from 'openai';
import type { DraftSuggestion, DraftTone, QuoteWithDerived } from '@/lib/domain';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

type ProviderDraft = {
  tone: DraftTone;
  title: string;
  channel: 'email' | 'text';
  subject?: string;
  body: string;
  rationale: string;
};

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
    subject: 'Following up on your roofing estimate',
    body: `Hi ${firstName},\n\nI wanted to check in on the roofing estimate we sent for ${quote.jobAddress}. We currently have you at ${amount}, and I’m happy to answer questions, review options, or talk through timing whenever you’re ready.\n\nIf you want, I can also give you a quick recap of next steps.\n\nThanks,`,
    rationale: `Simple low-pressure follow-up for an active quote.${extraContext}`,
    fallbackUsed: true,
  };
}

function fallbackDrafts(quote: QuoteWithDerived) {
  return [
    buildFallbackDraft(quote, 'friendly'),
    buildFallbackDraft(quote, 'urgent'),
    buildFallbackDraft(quote, 'sms'),
  ];
}

function validateProviderDrafts(input: unknown): ProviderDraft[] | null {
  if (!Array.isArray(input) || input.length !== 3) return null;

  const tones: DraftTone[] = ['friendly', 'urgent', 'sms'];
  const validated: ProviderDraft[] = [];

  for (const item of input) {
    if (!item || typeof item !== 'object') return null;
    const draft = item as Record<string, unknown>;
    if (!tones.includes(draft.tone as DraftTone)) return null;
    if (typeof draft.title !== 'string' || typeof draft.body !== 'string' || typeof draft.rationale !== 'string') return null;
    if (draft.channel !== 'email' && draft.channel !== 'text') return null;
    if (draft.subject != null && typeof draft.subject !== 'string') return null;

    validated.push({
      tone: draft.tone as DraftTone,
      title: draft.title,
      channel: draft.channel,
      subject: typeof draft.subject === 'string' ? draft.subject : undefined,
      body: draft.body,
      rationale: draft.rationale,
    });
  }

  const found = new Set(validated.map((draft) => draft.tone));
  if (found.size !== 3) return null;

  return tones.map((tone) => validated.find((draft) => draft.tone === tone)!).filter(Boolean);
}

async function generateProviderDrafts(quote: QuoteWithDerived): Promise<DraftSuggestion[] | null> {
  if (!openai) return null;

  const prompt = {
    businessContext: 'Quote Chaser is a roofing quote recovery tool for small roofing contractors.',
    goal: 'Generate concise follow-up drafts that help recover a sent roofing estimate without sounding like a pushy sales sequence.',
    requirements: [
      'Return exactly three drafts: friendly, urgent, sms.',
      'friendly and urgent should be email drafts with subject + body.',
      'sms should be a short text-style message with no subject.',
      'Use plain language suitable for a roofing contractor or office manager.',
      'Keep drafts practical, human, and easy to copy.',
      'Do not invent facts beyond the quote context.',
      'Mention the estimate naturally, not repeatedly.',
      'Urgent draft should create urgency without pressure or manipulation.',
      'SMS draft should be short enough to feel like a real text.',
      'Return valid JSON only.',
    ],
    quote: {
      customerName: quote.customerName,
      contactName: quote.contactName ?? null,
      phone: quote.phone ?? null,
      email: quote.email ?? null,
      jobAddress: quote.jobAddress,
      estimateAmount: estimateLabel(quote),
      status: quote.status,
      urgency: quote.urgency,
      quoteAgeDays: quote.quoteAgeDays,
      nextFollowUpLabel: quote.nextFollowUpLabel,
      lastTouchLabel: quote.lastTouchLabel,
      notes: quote.notes ?? null,
      recentActivities: quote.activities.slice(-3).map((activity) => ({
        type: activity.type,
        summary: activity.summary,
        createdAt: activity.createdAt,
      })),
    },
    outputShape: [
      {
        tone: 'friendly | urgent | sms',
        title: 'short label',
        channel: 'email | text',
        subject: 'string or omitted for sms',
        body: 'draft message body',
        rationale: '1 sentence explaining why this draft fits the quote context',
      },
    ],
  };

  try {
    const response = await openai.responses.create({
      model: 'gpt-5.4-mini',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: 'You write useful follow-up drafts for roofing estimate recovery. Return only valid JSON.',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: JSON.stringify(prompt),
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'quote_chaser_drafts',
          schema: {
            type: 'array',
            minItems: 3,
            maxItems: 3,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                tone: { type: 'string', enum: ['friendly', 'urgent', 'sms'] },
                title: { type: 'string' },
                channel: { type: 'string', enum: ['email', 'text'] },
                subject: { type: 'string' },
                body: { type: 'string' },
                rationale: { type: 'string' },
              },
              required: ['tone', 'title', 'channel', 'body', 'rationale'],
            },
          },
        },
      },
    });

    const content = response.output_text;
    if (!content) return null;

    const parsed = JSON.parse(content);
    const drafts = validateProviderDrafts(parsed);
    if (!drafts) return null;

    return drafts.map((draft) => ({ ...draft, fallbackUsed: false }));
  } catch {
    return null;
  }
}

export async function generateDraftSuggestions(quote: QuoteWithDerived): Promise<DraftSuggestion[]> {
  const providerDrafts = await generateProviderDrafts(quote);
  return providerDrafts ?? fallbackDrafts(quote);
}

export function aiDraftsEnabled() {
  return Boolean(process.env.OPENAI_API_KEY);
}
