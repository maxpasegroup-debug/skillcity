export function AnalyticsBreakdown({ rows, empty = "No data available" }: { rows: Array<{ key: string; count: number }>; empty?: string }) {
  if (rows.length === 0) return <p className="mt-4 text-sm font-semibold text-brand-muted">{empty}</p>;
  const maximum = Math.max(...rows.map((row) => row.count), 1);
  return <div className="mt-4 space-y-3">{rows.map((row) => <div key={row.key}><div className="flex items-center justify-between gap-4 text-sm"><span className="font-bold text-brand-dark">{row.key.replaceAll("_", " ")}</span><span className="font-black text-brand-muted">{row.count}</span></div><div className="mt-1 h-2 overflow-hidden rounded bg-black/5"><div className="h-full bg-brand-red" style={{ width: `${Math.max((row.count / maximum) * 100, row.count > 0 ? 4 : 0)}%` }} /></div></div>)}</div>;
}
