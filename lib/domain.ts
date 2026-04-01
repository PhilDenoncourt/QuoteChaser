export type QuoteStatus = 'sent' | 'follow_up_due' | 'waiting' | 'at_risk' | 'won' | 'lost';
export type ActivityType = 'call' | 'text' | 'email' | 'note' | 'status_change';
export type UrgencyState = 'healthy' | 'due_soon' | 'due_now' | 'at_risk';

export type Activity = {
  id: string;
  quoteId: string;
  type: ActivityType;
  summary: string;
  createdAt: string;
};

export type Quote = {
  id: string;
  customerName: string;
  contactName?: string;
  phone?: string;
  email?: string;
  jobAddress: string;
  estimateAmount: number;
  dateSent: string;
  status: QuoteStatus;
  nextFollowUpAt?: string;
  lastContactAt?: string;
  notes?: string;
  activities: Activity[];
};

export type QuoteWithDerived = Quote & {
  quoteAgeDays: number;
  daysUntilFollowUp: number | null;
  urgency: UrgencyState;
  lastTouchLabel: string;
  nextFollowUpLabel: string;
};

export type DraftTone = 'friendly' | 'urgent' | 'sms';

export type DraftSuggestion = {
  tone: DraftTone;
  title: string;
  channel: 'email' | 'text';
  subject?: string;
  body: string;
  rationale: string;
  fallbackUsed: boolean;
};
