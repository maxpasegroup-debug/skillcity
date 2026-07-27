import { CreditCard, HandCoins, Receipt } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getFinanceOverview } from "@/server/executive/queries";

export default async function FinancePage() {
  const finance = await getFinanceOverview();
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Finance" title="Executive finance overview" description="Revenue, expenses architecture, outstanding fees, scholarships, refunds, cash flow, commissions, trainer costs and payment gateways." /><section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"><DirectorMetricCard label="Revenue" value={`INR ${finance.revenue}`} icon={CreditCard} /><DirectorMetricCard label="Outstanding Fees" value={`INR ${finance.outstanding}`} icon={Receipt} /><DirectorMetricCard label="Scholarships" value={`INR ${finance.scholarships}`} icon={HandCoins} /><DirectorMetricCard label="BDM Commissions" value={`INR ${finance.commissions}`} icon={CreditCard} /></section><div className="grid gap-5 lg:grid-cols-2">{finance.payments.map((item) => <Card key={`${item.provider}-${item.status}`}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{item.provider} - {item.status}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">INR {item._sum.amount ?? 0}</h2><p className="mt-2 font-bold text-brand-muted">{item._count} transactions</p></CardContent></Card>)}</div></div>;
}
