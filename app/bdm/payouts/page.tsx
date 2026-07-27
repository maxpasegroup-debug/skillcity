import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getBdmDashboard, requireBdmUser } from "@/server/admissions/queries";

export default async function BdmPayoutsPage() {
  const user = await requireBdmUser();
  const payouts = (await getBdmDashboard(user.id)).commissions.filter((item) => item.status === "PAID");

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Payout History" title="Paid commissions" description="A clean record of commission payouts." />
      <div className="grid gap-5 lg:grid-cols-2">
        {payouts.map((payout) => (
          <Card key={payout.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{payout.createdAt.toDateString()}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">INR {payout.amount}</h2><p className="mt-2 font-bold text-brand-muted">{payout.type}</p></CardContent></Card>
        ))}
        {payouts.length === 0 ? <p className="font-semibold text-brand-muted">No payouts recorded yet.</p> : null}
      </div>
    </div>
  );
}
