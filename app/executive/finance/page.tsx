import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getExecutiveIntelligence } from "@/server/analytics/queries";

function money(currency: string, amount: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount); }

export default async function FinancePage() {
  const data = await getExecutiveIntelligence("THIS_YEAR");
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Finance" title="Executive finance overview" description="Authoritative invoice and successful-payment totals, kept separate by currency." />{data.finance.currencies.length === 0 ? <Card><CardContent className="p-6 font-semibold text-brand-muted">No data available.</CardContent></Card> : <div className="grid gap-5 lg:grid-cols-2">{data.finance.currencies.map((item) => <Card key={item.currency ?? "missing"}><CardContent className="p-6"><p className="text-sm font-black uppercase text-brand-red">{item.currency ?? "Currency missing"}</p>{item.currency ? <dl className="mt-5 grid grid-cols-3 gap-4"><div><dt className="text-sm font-bold text-brand-muted">Invoiced</dt><dd className="mt-1 text-xl font-black">{money(item.currency, item.invoiced)}</dd></div><div><dt className="text-sm font-bold text-brand-muted">Outstanding</dt><dd className="mt-1 text-xl font-black">{money(item.currency, item.outstanding)}</dd></div><div><dt className="text-sm font-bold text-brand-muted">Paid</dt><dd className="mt-1 text-xl font-black">{money(item.currency, item.paid)}</dd></div></dl> : <p className="mt-4 font-semibold text-brand-muted">Normalization required before amounts can be reported.</p>}<p className="mt-4 text-sm font-semibold text-brand-muted">{item.payments} successful payment transactions this year</p></CardContent></Card>)}</div>}</div>;
}
