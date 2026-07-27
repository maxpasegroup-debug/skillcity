import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getBdmDashboard, requireBdmUser } from "@/server/admissions/queries";

export default async function BdmWalletPage() {
  const user = await requireBdmUser();
  const { commissions } = await getBdmDashboard(user.id);
  const payable = commissions.filter((item) => item.status === "APPROVED").reduce((sum, item) => sum + item.amount, 0);
  const paid = commissions.filter((item) => item.status === "PAID").reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Wallet" title="BDM wallet" description="Approved commission is visible separately from paid payout history." />
      <section className="grid gap-5 md:grid-cols-2">
        <Card><CardContent className="p-6"><p className="font-bold text-brand-muted">Payable</p><h2 className="mt-2 text-4xl font-black text-brand-dark">INR {payable}</h2></CardContent></Card>
        <Card><CardContent className="p-6"><p className="font-bold text-brand-muted">Paid</p><h2 className="mt-2 text-4xl font-black text-brand-dark">INR {paid}</h2></CardContent></Card>
      </section>
    </div>
  );
}
