import Link from 'next/link';
import { notFound } from 'next/navigation';
import { QuoteForm } from '@/components/quote-form';
import { updateQuoteAction } from '@/app/quotes/actions';
import { getQuoteByIdForCurrentUser } from '@/lib/quotes';

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await getQuoteByIdForCurrentUser(id);

  if (!quote) notFound();

  const action = updateQuoteAction.bind(null, id);

  return (
    <main className="container mobile-shell">
      <div className="actions" style={{ marginBottom: 16 }}>
        <Link className="button secondary" href={`/quotes/${id}`}>← Quote detail</Link>
      </div>
      <section className="card" style={{ maxWidth: 760 }}>
        <h1>Edit Quote</h1>
        <p className="small">Update the estimate details without leaving the mobile-first flow.</p>
        <QuoteForm action={action} submitLabel="Save quote" quote={quote} />
      </section>
    </main>
  );
}
