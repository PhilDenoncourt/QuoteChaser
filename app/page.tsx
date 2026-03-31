import { followUpDrafts, sampleQuotes } from '@/lib/sample-data';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const statusClass: Record<string, string> = {
  new: 'ok',
  'follow-up-due': 'warning',
  'at-risk': 'danger',
  won: 'ok',
  lost: 'danger',
};

export default function HomePage() {
  const totalPipeline = sampleQuotes.reduce((sum, quote) => sum + quote.estimateAmount, 0);
  const dueToday = sampleQuotes.filter((quote) => quote.status === 'follow-up-due').length;
  const atRisk = sampleQuotes.filter((quote) => quote.status === 'at-risk').length;

  return (
    <main className="container">
      <section className="hero">
        <div className="header-row">
          <div>
            <p className="small">Quote Chaser · roofing contractor MVP</p>
            <h1>Recover more jobs from estimates you already sent.</h1>
          </div>
          <div className="actions">
            <a className="button" href="#queue">View follow-up queue</a>
            <a className="button secondary" href="#drafts">Review draft messages</a>
          </div>
        </div>
        <p>
          This first scaffold focuses on the core workflow: track sent estimates, flag quotes going cold,
          and make follow-up faster with simple templates and AI-assisted draft suggestions.
        </p>
      </section>

      <section className="kpis">
        <div className="kpi">
          <div className="label">Active pipeline</div>
          <div className="value">{currency.format(totalPipeline)}</div>
        </div>
        <div className="kpi">
          <div className="label">Needs follow-up today</div>
          <div className="value">{dueToday}</div>
        </div>
        <div className="kpi">
          <div className="label">At-risk quotes</div>
          <div className="value">{atRisk}</div>
        </div>
      </section>

      <section className="grid two">
        <div className="card" id="queue">
          <h2>Follow-up queue</h2>
          <p className="small">The first version of the dashboard should answer one question clearly: who needs attention today?</p>
          <table className="table">
            <thead>
              <tr>
                <th>Quote</th>
                <th>Value</th>
                <th>Status</th>
                <th>Next touch</th>
              </tr>
            </thead>
            <tbody>
              {sampleQuotes.map((quote) => (
                <tr key={quote.id}>
                  <td>
                    <strong>{quote.customerName}</strong>
                    <div className="small">{quote.jobAddress}</div>
                    <div className="small">{quote.note}</div>
                  </td>
                  <td>{currency.format(quote.estimateAmount)}</td>
                  <td>
                    <span className={`badge ${statusClass[quote.status]}`}>
                      {quote.status.replace(/-/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <strong>{quote.nextFollowUp}</strong>
                    <div className="small">Last touch: {quote.lastTouch}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid">
          <div className="card" id="drafts">
            <h2>Draft follow-up messages</h2>
            <p className="small">Templates will later become AI-personalized drafts using quote age, amount, and notes.</p>
            {followUpDrafts.map((draft) => (
              <div key={draft.title} style={{ marginBottom: 16 }}>
                <h3>{draft.title}</h3>
                <p className="small">{draft.text}</p>
              </div>
            ))}
          </div>

          <div className="card">
            <h2>First-build checklist</h2>
            <ul className="list small">
              <li>Wire a real Postgres-backed quote model</li>
              <li>Add create/edit quote flows</li>
              <li>Implement follow-up cadence rules</li>
              <li>Store activity history per quote</li>
              <li>Add AI-assisted draft generation</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
