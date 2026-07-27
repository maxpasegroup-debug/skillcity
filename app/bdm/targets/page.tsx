import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getBdmDashboard, requireBdmUser } from "@/server/admissions/queries";

export default async function BdmTargetsPage() {
  const user = await requireBdmUser();
  const { assignedLeads, monthlyRevenue } = await getBdmDashboard(user.id);
  const conversions = assignedLeads.filter((lead) => lead.status === "WON").length;

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Target" title="Monthly target" description="Track conversion and revenue progress without clutter." />
      <section className="grid gap-5 md:grid-cols-3">
        <Card><CardContent className="p-6"><p className="font-bold text-brand-muted">Lead Coverage</p><h2 className="mt-2 text-4xl font-black text-brand-dark">{assignedLeads.length}/100</h2></CardContent></Card>
        <Card><CardContent className="p-6"><p className="font-bold text-brand-muted">Conversions</p><h2 className="mt-2 text-4xl font-black text-brand-dark">{conversions}/20</h2></CardContent></Card>
        <Card><CardContent className="p-6"><p className="font-bold text-brand-muted">Revenue</p><h2 className="mt-2 text-4xl font-black text-brand-dark">INR {monthlyRevenue}</h2></CardContent></Card>
      </section>
    </div>
  );
}
