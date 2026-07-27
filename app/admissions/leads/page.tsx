import { Card, CardContent } from "@/components/ui/card";
import { LeadForm } from "@/features/admissions/components/admission-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getAdmissionData } from "@/server/admissions/queries";

export default async function LeadsPage() {
  const { stages, leads, programs, sources, users } = await getAdmissionData();

  return (
    <div className="space-y-10">
      <DirectorPageHeader
        eyebrow="CRM Pipeline"
        title="Lead management"
        description="Track every inquiry through a configurable acquisition pipeline."
      />

      <Card>
        <CardContent className="p-6 md:p-8">
          <LeadForm programs={programs} sources={sources} users={users} />
        </CardContent>
      </Card>

      <section className="grid gap-5 xl:grid-cols-3">
        {stages.map((stage) => (
          <Card key={stage.id}>
            <CardContent className="p-5">
              <h2 className="text-xl font-black text-brand-dark">{stage.name}</h2>
              <div className="mt-4 space-y-3">
                {leads.filter((lead) => lead.pipelineStageId === stage.id).map((lead) => (
                  <div key={lead.id} className="rounded-lg bg-white p-4">
                    <p className="font-black text-brand-dark">{lead.name}</p>
                    <p className="mt-1 text-sm font-bold text-brand-muted">{lead.phone} - {lead.priority}</p>
                    <p className="mt-1 text-sm font-bold text-brand-muted">{lead.programInterested?.name ?? "Program not selected"}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
