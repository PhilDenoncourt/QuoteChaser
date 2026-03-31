'use server';

import { redirect } from 'next/navigation';
import {
  addQuoteActivity,
  createQuote,
  hasValidationErrors,
  updateQuote,
  updateQuoteStatus,
  validateActivityInput,
  validateQuoteInput,
  validateStatusInput,
} from '@/lib/quotes';

export type QuoteFormState = {
  fieldErrors?: Partial<Record<'customerName' | 'contact' | 'jobAddress' | 'estimateAmount' | 'dateSent', string>>;
  values?: Record<string, string>;
};

export type ActivityFormState = {
  fieldErrors?: Partial<Record<'summary' | 'type', string>>;
  values?: Record<string, string>;
};

export type StatusFormState = {
  fieldErrors?: Partial<Record<'status', string>>;
  values?: Record<string, string>;
};

function formToInput(formData: FormData) {
  return {
    customerName: String(formData.get('customerName') ?? ''),
    contactName: String(formData.get('contactName') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    email: String(formData.get('email') ?? ''),
    jobAddress: String(formData.get('jobAddress') ?? ''),
    estimateAmount: Number(formData.get('estimateAmount') ?? 0),
    dateSent: String(formData.get('dateSent') ?? ''),
    notes: String(formData.get('notes') ?? ''),
  };
}

function valuesFromFormData(formData: FormData) {
  return Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, String(value)]));
}

export async function createQuoteAction(_: QuoteFormState, formData: FormData): Promise<QuoteFormState> {
  const input = formToInput(formData);
  const validation = validateQuoteInput(input);

  if (hasValidationErrors(validation)) {
    return { fieldErrors: validation.fieldErrors, values: valuesFromFormData(formData) };
  }

  const quote = await createQuote(input);
  redirect(`/quotes/${quote.id}`);
}

export async function updateQuoteAction(id: string, _: QuoteFormState, formData: FormData): Promise<QuoteFormState> {
  const input = formToInput(formData);
  const validation = validateQuoteInput(input);

  if (hasValidationErrors(validation)) {
    return { fieldErrors: validation.fieldErrors, values: valuesFromFormData(formData) };
  }

  await updateQuote(id, input);
  redirect(`/quotes/${id}`);
}

export async function addActivityAction(id: string, _: ActivityFormState, formData: FormData): Promise<ActivityFormState> {
  const input = {
    type: String(formData.get('type') ?? ''),
    summary: String(formData.get('summary') ?? ''),
    nextFollowUpDate: String(formData.get('nextFollowUpDate') ?? ''),
  };

  const validation = validateActivityInput(input);
  if (Object.keys(validation.fieldErrors).length > 0) {
    return { fieldErrors: validation.fieldErrors, values: valuesFromFormData(formData) };
  }

  await addQuoteActivity(id, input);
  redirect(`/quotes/${id}`);
}

export async function updateStatusAction(id: string, _: StatusFormState, formData: FormData): Promise<StatusFormState> {
  const input = {
    status: String(formData.get('status') ?? ''),
    nextFollowUpDate: String(formData.get('nextFollowUpDate') ?? ''),
  };

  const validation = validateStatusInput(input);
  if (Object.keys(validation.fieldErrors).length > 0) {
    return { fieldErrors: validation.fieldErrors, values: valuesFromFormData(formData) };
  }

  await updateQuoteStatus(id, input);
  redirect(`/quotes/${id}`);
}
