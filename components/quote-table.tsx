import Link from 'next/link';
import { StatusBadge } from '@/components/status-badge';
import { UrgencyBadge } from '@/components/urgency-badge';
import type { QuoteWithDerived } from '@/lib/domain';

export function QuoteTable({ quotes, title, subtitle }: { quotes: QuoteWithDerived[]; title: string; subtitle: string }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <p className="small">{subtitle}</p>
      <table className="table">
        <thead>
          <tr>
            <th>Quote</th>
            <th>Status</th>
            <th>Urgency</th>
            <th>Next touch</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((quote) => (
            <tr key={quote.id}>
              <td>
                <Link href={`/quotes/${quote.id}`}>
                  <strong>{quote.customerName}</strong>
                </Link>
                <div className="small">{quote.jobAddress}</div>
                <div className="small">${quote.estimateAmount.toLocaleString()}</div>
              </td>
              <td><StatusBadge status={quote.status} /></td>
              <td><UrgencyBadge urgency={quote.urgency} /></td>
              <td>
                <strong>{quote.nextFollowUpLabel}</strong>
                <div className="small">{quote.lastTouchLabel}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
