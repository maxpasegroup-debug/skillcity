import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getBdmDashboard, requireBdmUser } from "@/server/admissions/queries";

export default async function BdmLeadsPage() {
  const user = await requireBdmUser();
  const { assignedLeads } = await getBdmDashboard(user.id);

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Assigned Leads" title="Your lead list" description="Focus on the students you are responsible for converting." />
      <div className="grid gap-5 lg:grid-cols-2">
        {assignedLeads.map((lead) => (
          <Card key={lead.id}>
            <CardContent className="p-6">
              <p className="text-sm font-black text-brand-red">{lead.pipelineStage.name}</p>
              <h2 className="mt-2 text-2xl font-black text-brand-dark">{lead.name}</h2>
              <p className="mt-2 font-bold text-brand-muted">{lead.phone}</p>
              <p className="mt-1 font-bold text-brand-muted">{lead.programInterested?.name ?? "Program pending"} - {lead.priority}</p>
            </CardContent>
          </Card>
        ))}
        {assignedLeads.length === 0 ? <p className="font-semibold text-brand-muted">No leads assigned yet.</p> : null}
      </div>
    </div>
  );
}
