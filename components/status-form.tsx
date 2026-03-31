'use client';

import { useActionState } from 'react';
import type { QuoteWithDerived } from '@/lib/domain';
import type { StatusFormState } from '@/app/quotes/actions';

const initialState: StatusFormState = {};

function formatDateInput(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}

export function StatusForm({
  action,
  quote,
}: {
  action: (state: StatusFormState, formData: FormData) => Promise<StatusFormState>;
  quote: QuoteWithDerived;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const values = state.values ?? {};

  return (
    <form action={formAction} className="form-stack compact-form">
      <label>
        <div className="small">Status</div>
        <select className="input" name="status" defaultValue={values.status ?? quote.status}>
          <option value="sent">Sent</option>
          <option value="follow_up_due">Follow-up due</option>
          <option value="waiting">Waiting</option>
          <option value="at_risk">At risk</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
        {state.fieldErrors?.status ? <div className="error-text">{state.fieldErrors.status}</div> : null}
      </label>

      <label>
        <div className="small">Next follow-up date (optional)</div>
        <input
          className="input"
          type="date"
          name="nextFollowUpDate"
          defaultValue={values.nextFollowUpDate ?? formatDateInput(quote.nextFollowUpAt)}
        />
      </label>

      <div className="actions actions-stack-mobile submit-row">
        <button className="button" type="submit" disabled={pending}>
          {pending ? 'Updating…' : 'Update status'}
        </button>
      </div>
    </form>
  );
}
