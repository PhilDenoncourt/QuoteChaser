export function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="kpi">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}
