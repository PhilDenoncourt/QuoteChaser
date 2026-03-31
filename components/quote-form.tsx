'use client';

import { useActionState } from 'react';
import type { QuoteWithDerived } from '@/lib/domain';
import type { QuoteFormState } from '@/app/quotes/actions';

const initialState: QuoteFormState = {};

function formatDateInput(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}

export function QuoteForm({
  action,
  submitLabel,
  quote,
}: {
  action: (state: QuoteFormState, formData: FormData) => Promise<QuoteFormState>;
  submitLabel: string;
  quote?: QuoteWithDerived;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const values = state.values ?? {};

  return (
    <form action={formAction} className="form-stack" style={{ marginTop: 16 }}>
      <label>
        <div className="small">Customer name</div>
        <input className="input" name="customerName" defaultValue={values.customerName ?? quote?.customerName ?? ''} placeholder="Martin Family Roof Replacement" />
        {state.fieldErrors?.customerName ? <div className="error-text">{state.fieldErrors.customerName}</div> : null}
      </label>
      <label>
        <div className="small">Contact name</div>
        <input className="input" name="contactName" defaultValue={values.contactName ?? quote?.contactName ?? ''} placeholder="Holly Martin" />
      </label>
      <label>
        <div className="small">Phone</div>
        <input className="input" name="phone" inputMode="tel" defaultValue={values.phone ?? quote?.phone ?? ''} placeholder="(919) 555-0181" />
      </label>
      <label>
        <div className="small">Email</div>
        <input className="input" name="email" inputMode="email" defaultValue={values.email ?? quote?.email ?? ''} placeholder="holly@example.com" />
        {state.fieldErrors?.contact ? <div className="error-text">{state.fieldErrors.contact}</div> : null}
      </label>
      <label>
        <div className="small">Job address</div>
        <input className="input" name="jobAddress" defaultValue={values.jobAddress ?? quote?.jobAddress ?? ''} placeholder="Raleigh, NC" />
        {state.fieldErrors?.jobAddress ? <div className="error-text">{state.fieldErrors.jobAddress}</div> : null}
      </label>
      <label>
        <div className="small">Estimate amount</div>
        <input className="input" name="estimateAmount" inputMode="decimal" defaultValue={values.estimateAmount ?? String(quote?.estimateAmount ?? '')} placeholder="18400" />
        {state.fieldErrors?.estimateAmount ? <div className="error-text">{state.fieldErrors.estimateAmount}</div> : null}
      </label>
      <label>
        <div className="small">Date sent</div>
        <input className="input" name="dateSent" type="date" defaultValue={values.dateSent ?? formatDateInput(quote?.dateSent)} />
        {state.fieldErrors?.dateSent ? <div className="error-text">{state.fieldErrors.dateSent}</div> : null}
      </label>
      <label className="notes-field">
        <div className="small">Notes</div>
        <textarea className="textarea" name="notes" defaultValue={values.notes ?? quote?.notes ?? ''} placeholder="Customer asked about financing options." />
      </label>

      <div className="actions actions-stack-mobile submit-row">
        <button className="button" type="submit" disabled={pending}>
          {pending ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
