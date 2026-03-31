import Link from 'next/link';
import { createQuoteAction } from '@/app/quotes/actions';
import { QuoteForm } from '@/components/quote-form';

export default function NewQuotePage() {
  return (
    <main className="container mobile-shell">
      <div className="actions" style={{ marginBottom: 16 }}>
        <Link className="button secondary" href="/">← Dashboard</Link>
      </div>

      <section className="card" style={{ maxWidth: 760 }}>
        <h1>New Quote</h1>
        <p className="small">
          This form is built mobile-first: short, tappable, and fast enough to use from a phone right after sending an estimate.
        </p>
        <QuoteForm action={createQuoteAction} submitLabel="Create quote" />
      </section>
    </main>
  );
}
