const DAY_MS = 24 * 60 * 60 * 1000;

export function diffDays(fromIso: string, to = new Date()): number {
  const from = new Date(fromIso);
  return Math.floor((to.getTime() - from.getTime()) / DAY_MS);
}

export function diffDaysUntil(targetIso?: string, from = new Date()): number | null {
  if (!targetIso) return null;
  const target = new Date(targetIso);
  return Math.floor((target.getTime() - from.getTime()) / DAY_MS);
}

export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(iso));
}
