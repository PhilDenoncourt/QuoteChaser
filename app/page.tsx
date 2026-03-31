import Link from 'next/link';
import { MetricCard } from '@/components/metric-card';
import { QuoteTable } from '@/components/quote-table';
import { draftTemplates, getDashboardMetrics, getQuotes, sortQueue } from '@/lib/quotes';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default function HomePage() {
  const quotes = getQuotes();
  const queue = sortQueue(quotes.filter((quote) => !['won', 'lost'].includes(quote.status)));
  const recent = [...quotes]
    .filter((quote) => quote.quoteAgeDays <= 3)
    .sort((a, b) => a.quoteAgeDays - b.quoteAgeDays);
  const metrics = getDashboardMetrics(quotes);

  return (
    <main className="container">
      <section className="hero">
        <div className="header-row">
          <div>
            <p className="small">Quote Chaser · roofing contractor MVP</p>
            <h1>Recover more jobs from estimates you already sent.</h1>
          </div>
          <div className="actions">
            <Link className="button" href="/quotes/new">Add new quote</Link>
            <a className="button secondary" href="#drafts">Review draft messages</a>
          </div>
        </div>
        <p>
          Milestone 1 is now shaping the app around the real product model: urgency-first dashboard,
          quote detail routes, and shared quote logic that can later be backed by Postgres.
        </p>
      </section>

      <section className="kpis">
        <MetricCard label="Active pipeline" value={currency.format(metrics.activePipelineValue)} />
        <MetricCard label="Needs follow-up today" value={metrics.dueTodayCount} />
        <MetricCard label="At-risk quotes" value={metrics.atRiskCount} />
        <MetricCard label="Recently sent quotes" value={metrics.recentCount} />
      </section>

      <section className="grid two">
        <QuoteTable quotes={queue} title="Follow-up queue" subtitle="This is the heart of the product: who needs attention now, and which quotes are going cold?" />
        <div className="grid">
          <QuoteTable quotes={recent} title="Recently sent quotes" subtitle="Fresh pipeline that should be captured before it slips into silence." />
          <div className="card" id="drafts">
            <h2>Draft follow-up message styles</h2>
            <p className="small">These will become AI-assisted drafts backed by quote context in a later milestone.</p>
            {draftTemplates.map((draft) => (
              <div key={draft.title} style={{ marginBottom: 16 }}>
                <h3>{draft.title}</h3>
                <p className="small">{draft.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
