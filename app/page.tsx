import Link from 'next/link';
import { FilterBar } from '@/components/filter-bar';
import { MetricCard } from '@/components/metric-card';
import { QueueSection } from '@/components/queue-section';
import { QuoteCardList } from '@/components/quote-card-list';
import { draftTemplates, filterQuotes, getDashboardMetrics, getQuotes, groupQueueByUrgency, sortQueue } from '@/lib/quotes';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ urgency?: string; status?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const urgencyFilter = params.urgency ?? 'all';
  const statusFilter = params.status ?? 'all';

  const quotes = await getQuotes();
  const activeQuotes = quotes.filter((quote) => !['won', 'lost'].includes(quote.status));
  const filteredQueue = sortQueue(filterQuotes(activeQuotes, { urgency: urgencyFilter, status: statusFilter }));
  const grouped = groupQueueByUrgency(filteredQueue);
  const recent = [...quotes]
    .filter((quote) => quote.quoteAgeDays <= 3)
    .sort((a, b) => a.quoteAgeDays - b.quoteAgeDays)
    .slice(0, 4);
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

      <section className="card">
        <h2>Work queue filters</h2>
        <p className="small">Narrow the queue to what matters right now.</p>
        <FilterBar
          title="Urgency"
          param="urgency"
          active={urgencyFilter}
          items={[
            { label: 'All', value: 'all' },
            { label: 'At risk', value: 'at_risk' },
            { label: 'Due now', value: 'due_now' },
            { label: 'Due soon', value: 'due_soon' },
            { label: 'Healthy', value: 'healthy' },
          ]}
        />
        <FilterBar
          title="Status"
          param="status"
          active={statusFilter}
          items={[
            { label: 'All', value: 'all' },
            { label: 'Sent', value: 'sent' },
            { label: 'Follow-up due', value: 'follow_up_due' },
            { label: 'Waiting', value: 'waiting' },
            { label: 'At risk', value: 'at_risk' },
          ]}
        />
      </section>

      <section className="grid mobile-stack">
        <QueueSection urgency="at_risk" quotes={grouped.at_risk} />
        <QueueSection urgency="due_now" quotes={grouped.due_now} />
        <QueueSection urgency="due_soon" quotes={grouped.due_soon} />
        {urgencyFilter === 'all' && statusFilter === 'all' ? (
          <QueueSection urgency="healthy" quotes={grouped.healthy.slice(0, 3)} />
        ) : null}

        {!filteredQueue.length ? (
          <div className="card">
            <h2>Queue clear</h2>
            <p className="small">No quotes match the current filters. Try switching back to All, or add a new quote.</p>
            <div className="actions actions-stack-mobile" style={{ marginTop: 12 }}>
              <Link className="button" href="/quotes/new">Add new quote</Link>
              <Link className="button secondary" href="/">Reset filters</Link>
            </div>
          </div>
        ) : null}

        <QuoteCardList
          quotes={recent}
          title="Recently sent quotes"
          subtitle="Fresh estimates that should stay visible before they go cold."
          compact
        />

        <div className="card" id="drafts">
          <h2>Draft follow-up message styles</h2>
          <p className="small">These will become AI-assisted drafts backed by quote context in a later milestone.</p>
          <div className="card-list">
            {draftTemplates.map((draft) => (
              <div key={draft.title} className="quote-card static-card quote-card-compact">
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
