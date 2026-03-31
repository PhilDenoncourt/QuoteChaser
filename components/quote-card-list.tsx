import Link from 'next/link';
import { StatusBadge } from '@/components/status-badge';
import { UrgencyBadge } from '@/components/urgency-badge';
import type { QuoteWithDerived } from '@/lib/domain';

export function QuoteCardList({
  quotes,
  title,
  subtitle,
  compact = false,
}: {
  quotes: QuoteWithDerived[];
  title: string;
  subtitle: string;
  compact?: boolean;
}) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <p className="small">{subtitle}</p>
      <div className="card-list">
        {quotes.map((quote) => (
          <Link key={quote.id} href={`/quotes/${quote.id}`} className={`quote-card ${compact ? 'quote-card-compact' : ''}`}>
            <div className="quote-card-top">
              <div>
                <strong>{quote.customerName}</strong>
                <div className="small">{quote.jobAddress}</div>
              </div>
              <div className="quote-card-badges">
                <UrgencyBadge urgency={quote.urgency} />
                <StatusBadge status={quote.status} />
              </div>
            </div>

            <div className="quote-card-metrics">
              <div>
                <div className="small">Estimate</div>
                <div className="quote-card-value">${quote.estimateAmount.toLocaleString()}</div>
              </div>
              <div>
                <div className="small">Next touch</div>
                <div>{quote.nextFollowUpLabel}</div>
              </div>
            </div>

            <div className="quote-card-footer-grid">
              <div className="small quote-card-footer">{quote.lastTouchLabel}</div>
              <div className="small quote-card-footer">{quote.quoteAgeDays}d old</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
