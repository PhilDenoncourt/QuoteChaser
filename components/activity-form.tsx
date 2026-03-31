'use client';

import { useActionState } from 'react';
import type { ActivityFormState } from '@/app/quotes/actions';

const initialState: ActivityFormState = {};

export function ActivityForm({
  action,
}: {
  action: (state: ActivityFormState, formData: FormData) => Promise<ActivityFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const values = state.values ?? {};

  return (
    <form action={formAction} className="form-stack compact-form">
      <label>
        <div className="small">Touch type</div>
        <select className="input" name="type" defaultValue={values.type ?? 'call'}>
          <option value="call">Call</option>
          <option value="text">Text</option>
          <option value="email">Email</option>
          <option value="note">Note</option>
        </select>
        {state.fieldErrors?.type ? <div className="error-text">{state.fieldErrors.type}</div> : null}
      </label>

      <label className="notes-field">
        <div className="small">What happened?</div>
        <textarea
          className="textarea"
          name="summary"
          defaultValue={values.summary ?? ''}
          placeholder="Left voicemail and offered to answer questions about the estimate."
        />
        {state.fieldErrors?.summary ? <div className="error-text">{state.fieldErrors.summary}</div> : null}
      </label>

      <label>
        <div className="small">Next follow-up date (optional)</div>
        <input className="input" type="date" name="nextFollowUpDate" defaultValue={values.nextFollowUpDate ?? ''} />
      </label>

      <div className="actions actions-stack-mobile submit-row">
        <button className="button secondary" type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Log touch'}
        </button>
      </div>
    </form>
  );
}
