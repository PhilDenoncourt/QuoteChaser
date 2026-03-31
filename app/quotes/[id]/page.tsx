import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatusBadge } from '@/components/status-badge';
import { UrgencyBadge } from '@/components/urgency-badge';
import { draftTemplates, getQuoteById } from '@/lib/quotes';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = getQuoteById(id);

  if (!quote) notFound();

  return (
    <main className="container">
      <div className="actions" style={{ marginBottom: 20 }}>
        <Link className="button secondary" href="/">← Back to dashboard</Link>
      </div>

      <section className="grid" style={{ gap: 16 }}>
        <div className="card">
          <div className="header-row">
            <div>
              <p className="small">Quote {quote.id}</p>
              <h1 style={{ marginBottom: 8 }}>{quote.customerName}</h1>
              <p className="small">{quote.jobAddress}</p>
            </div>
            <div className="actions">
              <StatusBadge status={quote.status} />
              <UrgencyBadge urgency={quote.urgency} />
            </div>
          </div>

          <div className="kpis">
            <div className="kpi">
              <div className="label">Estimate amount</div>
              <div className="value">{currency.format(quote.estimateAmount)}</div>
            </div>
            <div className="kpi">
              <div className="label">Sent</div>
              <div className="value" style={{ fontSize: '1.2rem' }}>{new Date(quote.dateSent).toLocaleDateString()}</div>
            </div>
            <div className="kpi">
              <div className="label">Next follow-up</div>
              <div className="value" style={{ fontSize: '1.2rem' }}>{quote.nextFollowUpLabel}</div>
            </div>
          </div>
        </div>

        <div className="grid two">
          <div className="card">
            <h2>Action panel</h2>
            <ul className="list small">
              <li>Update status</li>
              <li>Change next follow-up date</li>
              <li>Log a call, text, email, or note</li>
              <li>Generate and copy a follow-up draft</li>
            </ul>
            <p className="small">These actions are listed explicitly now so Milestone 2 and 3 can wire them in without ambiguity.</p>
          </div>

          <div className="card">
            <h2>Quote context</h2>
            <p><strong>Contact:</strong> {quote.contactName ?? '—'}</p>
            <p><strong>Phone:</strong> {quote.phone ?? '—'}</p>
            <p><strong>Email:</strong> {quote.email ?? '—'}</p>
            <p><strong>Notes:</strong> {quote.notes ?? '—'}</p>
          </div>
        </div>

        <div className="grid two">
          <div className="card">
            <h2>Activity timeline</h2>
            {quote.activities
              .slice()
              .reverse()
              .map((activity) => (
                <div key={activity.id} style={{ marginBottom: 14 }}>
                  <strong>{activity.type.replace('_', ' ')}</strong>
                  <div className="small">{new Date(activity.createdAt).toLocaleString()}</div>
                  <div className="small">{activity.summary}</div>
                </div>
              ))}
          </div>

          <div className="card">
            <h2>Draft suggestions</h2>
            {draftTemplates.map((draft) => (
              <div key={draft.title} style={{ marginBottom: 16 }}>
                <h3>{draft.title}</h3>
                <p className="small">{draft.text.replace('{{name}}', quote.contactName ?? quote.customerName)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
