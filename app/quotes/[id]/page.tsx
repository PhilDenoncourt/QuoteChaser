import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ActivityForm } from '@/components/activity-form';
import { DraftSuggestions } from '@/components/draft-suggestions';
import { StatusBadge } from '@/components/status-badge';
import { StatusForm } from '@/components/status-form';
import { UrgencyBadge } from '@/components/urgency-badge';
import { addActivityAction, updateStatusAction } from '@/app/quotes/actions';
import { aiDraftsEnabled, generateDraftSuggestions } from '@/lib/drafts';
import { getQuoteById } from '@/lib/quotes';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await getQuoteById(id);

  if (!quote) notFound();

  const activityAction = addActivityAction.bind(null, id);
  const statusAction = updateStatusAction.bind(null, id);
  const drafts = generateDraftSuggestions(quote);
  const aiEnabled = aiDraftsEnabled();

  return (
    <main className="container mobile-shell">
      <div className="actions" style={{ marginBottom: 16 }}>
        <Link className="button secondary" href="/">← Dashboard</Link>
      </div>

      <section className="grid mobile-stack" style={{ gap: 16 }}>
        <div className="card detail-hero">
          <p className="small">Quote {quote.id}</p>
          <h1 style={{ marginBottom: 8 }}>{quote.customerName}</h1>
          <p className="small">{quote.jobAddress}</p>

          <div className="quote-card-badges" style={{ marginTop: 12, marginBottom: 12 }}>
            <UrgencyBadge urgency={quote.urgency} />
            <StatusBadge status={quote.status} />
          </div>

          <div className="detail-stats">
            <div className="detail-stat">
              <div className="small">Estimate</div>
              <strong>{currency.format(quote.estimateAmount)}</strong>
            </div>
            <div className="detail-stat">
              <div className="small">Sent</div>
              <strong>{new Date(quote.dateSent).toLocaleDateString()}</strong>
            </div>
            <div className="detail-stat">
              <div className="small">Next follow-up</div>
              <strong>{quote.nextFollowUpLabel}</strong>
            </div>
          </div>
        </div>

        <div className="card action-card">
          <h2>Next actions</h2>
          <div className="actions actions-stack-mobile" style={{ marginTop: 12, marginBottom: 12 }}>
            <Link className="button secondary" href={`/quotes/${quote.id}/edit`}>Edit quote</Link>
          </div>
          <StatusForm action={statusAction} quote={quote} />
          <p className="small" style={{ marginTop: 12 }}>
            Mobile-first rule: the action panel stays high on the page so the user can update the quote quickly between calls or job visits.
          </p>
        </div>

        <div className="card">
          <h2>Log touch</h2>
          <p className="small">Calls, texts, emails, and notes should be easy to record while standing in a driveway or between calls.</p>
          <ActivityForm action={activityAction} />
        </div>

        <div className="card">
          <h2>Quote context</h2>
          <div className="detail-list">
            <div><span className="small">Contact</span><strong>{quote.contactName ?? '—'}</strong></div>
            <div><span className="small">Phone</span><strong>{quote.phone ?? '—'}</strong></div>
            <div><span className="small">Email</span><strong>{quote.email ?? '—'}</strong></div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div className="small">Notes</div>
            <p>{quote.notes ?? '—'}</p>
          </div>
        </div>

        <div className="card">
          <h2>Activity timeline</h2>
          <div className="timeline-list">
            {quote.activities
              .slice()
              .reverse()
              .map((activity) => (
                <div key={activity.id} className="timeline-item">
                  <strong>{activity.type.replace('_', ' ')}</strong>
                  <div className="small">{new Date(activity.createdAt).toLocaleString()}</div>
                  <div className="small">{activity.summary}</div>
                </div>
              ))}
          </div>
        </div>

        <div className="card">
          <DraftSuggestions drafts={drafts} aiEnabled={aiEnabled} />
        </div>
      </section>
    </main>
  );
}
