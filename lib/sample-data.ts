export type QuoteStatus = 'new' | 'follow-up-due' | 'at-risk' | 'won' | 'lost';

export type Quote = {
  id: string;
  customerName: string;
  jobAddress: string;
  estimateAmount: number;
  dateSent: string;
  status: QuoteStatus;
  nextFollowUp: string;
  lastTouch: string;
  note: string;
};

export const sampleQuotes: Quote[] = [
  {
    id: 'QC-1042',
    customerName: 'Martin Family Roof Replacement',
    jobAddress: 'Raleigh, NC',
    estimateAmount: 18400,
    dateSent: '2026-03-25',
    status: 'follow-up-due',
    nextFollowUp: 'Today, 4:00 PM',
    lastTouch: '2 days ago',
    note: 'Customer asked about financing options.',
  },
  {
    id: 'QC-1041',
    customerName: 'Harris Storm Damage Repair',
    jobAddress: 'Durham, NC',
    estimateAmount: 12650,
    dateSent: '2026-03-22',
    status: 'at-risk',
    nextFollowUp: 'Overdue by 1 day',
    lastTouch: '5 days ago',
    note: 'Insurance timing may delay decision.',
  },
  {
    id: 'QC-1040',
    customerName: 'Bluebird Church Roof Patch',
    jobAddress: 'Cary, NC',
    estimateAmount: 4300,
    dateSent: '2026-03-29',
    status: 'new',
    nextFollowUp: 'Tomorrow, 10:00 AM',
    lastTouch: 'Sent today',
    note: 'Quick repair. Wants fast turnaround.',
  },
];

export const followUpDrafts = [
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
