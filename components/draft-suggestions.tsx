'use client';

import { useMemo, useState } from 'react';
import type { DraftSuggestion } from '@/lib/domain';

export function DraftSuggestions({
  drafts,
  aiEnabled,
}: {
  drafts: DraftSuggestion[];
  aiEnabled: boolean;
}) {
  const [selectedTone, setSelectedTone] = useState<DraftSuggestion['tone']>(drafts[0]?.tone ?? 'friendly');
  const [copied, setCopied] = useState<string | null>(null);

  const activeDraft = useMemo(
    () => drafts.find((draft) => draft.tone === selectedTone) ?? drafts[0],
    [drafts, selectedTone],
  );

  if (!activeDraft) return null;

  async function copyDraft() {
    const text = [activeDraft.subject ? `Subject: ${activeDraft.subject}` : null, activeDraft.body]
      .filter(Boolean)
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(activeDraft.tone);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="draft-panel">
      <div className="draft-header-row">
        <div>
          <h2>Draft suggestions</h2>
          <p className="small">
            {aiEnabled
              ? 'AI-backed drafts are enabled.'
              : 'Fallback templates are active right now. Add an AI key later to upgrade the draft engine without changing the workflow.'}
          </p>
        </div>
        <div className="filter-chips">
          {drafts.map((draft) => (
            <button
              key={draft.tone}
              type="button"
              className={`filter-chip ${selectedTone === draft.tone ? 'active' : ''}`}
              onClick={() => setSelectedTone(draft.tone)}
            >
              {draft.title}
            </button>
          ))}
        </div>
      </div>

      <div className="draft-card">
        <div className="draft-meta-row">
          <span className="badge ok">{activeDraft.channel === 'text' ? 'SMS-style' : 'Email-style'}</span>
          {activeDraft.fallbackUsed ? <span className="badge warning">Fallback</span> : <span className="badge ok">AI</span>}
        </div>

        {activeDraft.subject ? (
          <div className="draft-block">
            <div className="small">Subject</div>
            <strong>{activeDraft.subject}</strong>
          </div>
        ) : null}

        <div className="draft-block">
          <div className="small">Message</div>
          <pre className="draft-body">{activeDraft.body}</pre>
        </div>

        <div className="draft-block">
          <div className="small">Why this draft</div>
          <p className="small">{activeDraft.rationale}</p>
        </div>

        <div className="actions actions-stack-mobile">
          <button type="button" className="button" onClick={copyDraft}>
            {copied === activeDraft.tone ? 'Copied' : 'Copy draft'}
          </button>
        </div>
      </div>
    </div>
  );
}
