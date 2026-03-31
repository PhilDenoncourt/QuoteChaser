import Link from 'next/link';
import { MetricCard } from '@/components/metric-card';
import { QuoteCardList } from '@/components/quote-card-list';
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
    <main className="container mobile-shell">
      <section className="hero mobile-hero">
        <div>
          <p className="small">Quote Chaser · roofing contractor MVP</p>
          <h1>Quotes don’t die quietly anymore.</h1>
          <p>
            Recover more roofing jobs from estimates you already sent. Quote Chaser keeps follow-up visible,
            urgent, and easy to act on from your phone.
          </p>
        </div>
        <div className="actions actions-stack-mobile">
          <Link className="button" href="/quotes/new">Add new quote</Link>
          <a className="button secondary" href="#drafts">Draft messages</a>
        </div>
      </section>

      <section className="kpis mobile-kpis">
        <MetricCard label="Needs follow-up today" value={metrics.dueTodayCount} />
        <MetricCard label="At-risk quotes" value={metrics.atRiskCount} />
        <MetricCard label="Active pipeline" value={currency.format(metrics.activePipelineValue)} />
        <MetricCard label="Recently sent" value={metrics.recentCount} />
      </section>

      <section className="grid mobile-stack">
        <QuoteCardList
          quotes={queue}
          title="Follow-up queue"
          subtitle="This is the main work surface: who needs attention now, and which quotes are slipping?"
        />

        <QuoteCardList
          quotes={recent}
          title="Recently sent quotes"
          subtitle="Fresh estimates that should stay visible before they go cold."
        />

        <div className="card" id="drafts">
          <h2>Draft follow-up message styles</h2>
          <p className="small">These will become AI-assisted drafts backed by quote context in a later milestone.</p>
          <div className="card-list">
            {draftTemplates.map((draft) => (
              <div key={draft.title} className="quote-card static-card">
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
