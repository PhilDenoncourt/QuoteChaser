import Link from 'next/link';

export default function NewQuotePage() {
  return (
    <main className="container">
      <div className="actions" style={{ marginBottom: 20 }}>
        <Link className="button secondary" href="/">← Back to dashboard</Link>
      </div>

      <section className="card" style={{ maxWidth: 760 }}>
        <h1>New Quote</h1>
        <p className="small">
          This route is in place for Milestone 2. The v1 create flow will stay intentionally lean:
          customer name, contact method, job address, estimate amount, date sent, and notes.
        </p>

        <div className="grid two" style={{ marginTop: 16 }}>
          <label>
            <div className="small">Customer name</div>
            <input className="input" placeholder="Martin Family Roof Replacement" />
          </label>
          <label>
            <div className="small">Contact name</div>
            <input className="input" placeholder="Holly Martin" />
          </label>
          <label>
            <div className="small">Phone</div>
            <input className="input" placeholder="(919) 555-0181" />
          </label>
          <label>
            <div className="small">Email</div>
            <input className="input" placeholder="holly@example.com" />
          </label>
          <label>
            <div className="small">Job address</div>
            <input className="input" placeholder="Raleigh, NC" />
          </label>
          <label>
            <div className="small">Estimate amount</div>
            <input className="input" placeholder="18400" />
          </label>
          <label>
            <div className="small">Date sent</div>
            <input className="input" type="date" />
          </label>
        </div>

        <label style={{ display: 'block', marginTop: 16 }}>
          <div className="small">Notes</div>
          <textarea className="textarea" placeholder="Customer asked about financing options." />
        </label>

        <div className="actions" style={{ marginTop: 18 }}>
          <button className="button" type="button">Create quote (Milestone 2)</button>
        </div>
      </section>
    </main>
  );
}
