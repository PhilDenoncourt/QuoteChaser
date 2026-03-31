import Link from 'next/link';

export default function NewQuotePage() {
  return (
    <main className="container mobile-shell">
      <div className="actions" style={{ marginBottom: 16 }}>
        <Link className="button secondary" href="/">← Dashboard</Link>
      </div>

      <section className="card" style={{ maxWidth: 760 }}>
        <h1>New Quote</h1>
        <p className="small">
          This form is being built mobile-first: short, tappable, and fast enough to use from a phone right after sending an estimate.
        </p>

        <div className="form-stack" style={{ marginTop: 16 }}>
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
            <input className="input" inputMode="tel" placeholder="(919) 555-0181" />
          </label>
          <label>
            <div className="small">Email</div>
            <input className="input" inputMode="email" placeholder="holly@example.com" />
          </label>
          <label>
            <div className="small">Job address</div>
            <input className="input" placeholder="Raleigh, NC" />
          </label>
          <label>
            <div className="small">Estimate amount</div>
            <input className="input" inputMode="decimal" placeholder="18400" />
          </label>
          <label>
            <div className="small">Date sent</div>
            <input className="input" type="date" />
          </label>
          <label>
            <div className="small">Notes</div>
            <textarea className="textarea" placeholder="Customer asked about financing options." />
          </label>
        </div>

        <div className="actions actions-stack-mobile" style={{ marginTop: 18 }}>
          <button className="button" type="button">Create quote (Milestone 2)</button>
        </div>
      </section>
    </main>
  );
}
