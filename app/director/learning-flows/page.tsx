import { Workflow } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AttachLearningFlowForm, LearningFlowForm } from "@/features/altt/components/director-learning-flow-forms";
import { DirectorEmptyState } from "@/features/director/components/director-empty-state";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getDirectorLearningFlows } from "@/server/altt/queries";
import { getDirectorPlanner } from "@/server/director/queries";

export const dynamic = "force-dynamic";

export default async function DirectorLearningFlowsPage() {
  const [flows, journeys] = await Promise.all([getDirectorLearningFlows(), getDirectorPlanner()]);
  const days = journeys.flatMap((journey) =>
    journey.phases.flatMap((phase) =>
      phase.weeks.flatMap((week) =>
        week.days.map((day) => ({
          id: day.id,
          name: `${journey.program.name} · Week ${week.weekNumber} · Day ${day.dayNumber}: ${day.title}`
        }))
      )
    )
  );

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="ALTT Engine" title="Learning Flows" description="Create reusable ALTT sequences and attach them to Journey Days." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardContent className="p-6 md:p-8"><h2 className="mb-5 text-2xl font-black text-brand-dark">Create Flow</h2><LearningFlowForm /></CardContent></Card>
        <Card><CardContent className="p-6 md:p-8"><h2 className="mb-5 text-2xl font-black text-brand-dark">Attach Flow</h2><AttachLearningFlowForm flows={flows} days={days} /></CardContent></Card>
      </div>
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-brand-dark">Reusable Flows</h2>
        {flows.length === 0 ? <DirectorEmptyState icon={Workflow} message="No ALTT learning flows exist yet. Create the first configurable flow above." /> : (
          <div className="grid gap-5 lg:grid-cols-2">
            {flows.map((flow) => (
              <Card key={flow.id}>
                <CardContent className="p-6">
                  <p className="text-sm font-black text-brand-red">{flow.status} · Version {flow.version}</p>
                  <h3 className="mt-2 text-2xl font-black text-brand-dark">{flow.name}</h3>
                  <p className="mt-3 text-sm font-bold text-brand-muted">{flow.steps.length} steps · attached to {flow.days.length} days</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {flow.steps.map((step) => <span key={step.id} className="rounded-lg bg-brand-beige px-3 py-2 text-sm font-bold text-brand-dark">{step.title}</span>)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
