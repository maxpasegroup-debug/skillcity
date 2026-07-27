import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getBdmDashboard, requireBdmUser } from "@/server/admissions/queries";

export default async function BdmCommissionsPage() {
  const user = await requireBdmUser();
  const { commissions } = await getBdmDashboard(user.id);

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Commission" title="Commission history" description="Fixed, percentage, program, referral, and manual adjustment records flow through approval before payout." />
      <div className="grid gap-5 lg:grid-cols-2">
        {commissions.map((commission) => (
          <Card key={commission.id}>
            <CardContent className="p-6">
              <p className="text-sm font-black text-brand-red">{commission.status}</p>
              <h2 className="mt-2 text-2xl font-black text-brand-dark">INR {commission.amount}</h2>
              <p className="mt-2 font-bold text-brand-muted">{commission.type} - {commission.program?.name ?? "General"}</p>
            </CardContent>
          </Card>
        ))}
        {commissions.length === 0 ? <p className="font-semibold text-brand-muted">No commission records yet.</p> : null}
      </div>
    </div>
  );
}
