import Link from 'next/link';

export function FilterBar({
  title,
  items,
  active,
  param,
}: {
  title: string;
  items: { label: string; value: string }[];
  active: string;
  param: string;
}) {
  return (
    <div className="filter-bar">
      <div className="small filter-title">{title}</div>
      <div className="filter-chips">
        {items.map((item) => {
          const href = item.value === 'all' ? '/' : `/?${param}=${encodeURIComponent(item.value)}`;
          const isActive = active === item.value;
          return (
            <Link key={item.value} href={href} className={`filter-chip ${isActive ? 'active' : ''}`}>
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
