import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function AnalyticsMetricCard({ label, value, icon: Icon, detail }: { label: string; value: string | number; icon: LucideIcon; detail?: string }) {
  return <Card><CardContent className="p-5"><div className="flex items-center justify-between gap-3"><p className="text-xs font-black uppercase text-brand-muted">{label}</p><Icon className="h-5 w-5 text-brand-red" /></div><p className="mt-3 text-3xl font-black text-brand-dark">{value}</p>{detail ? <p className="mt-2 text-sm font-semibold text-brand-muted">{detail}</p> : null}</CardContent></Card>;
}

export function comparisonDetail(previous: number, changePercent: number | null) {
  return changePercent === null ? `Previous comparable period: ${previous}` : `${changePercent > 0 ? "+" : ""}${changePercent}% vs previous comparable period`;
}
