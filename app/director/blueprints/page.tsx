import { Layers3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DuplicateBlueprintButton } from "@/features/director/components/director-action-buttons";
import { DirectorEmptyState } from "@/features/director/components/director-empty-state";
import { BlueprintForm } from "@/features/director/components/director-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getDirectorBlueprints, getDirectorPlanner, getDirectorPrograms } from "@/server/director/queries";
import Link from "next/link";

export default async function DirectorBlueprintsPage() {
  const [blueprints, programs, journeys] = await Promise.all([getDirectorBlueprints(), getDirectorPrograms(), getDirectorPlanner()]);

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Blueprints" title="Learning Blueprint Builder" description="A blueprint captures the complete learning plan that can be versioned and duplicated for future batches." />
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary"><Link href="/director/content-library">Open Content Library</Link></Button>
        <Button asChild variant="secondary"><Link href="/director/journey-planner">Open Day Planner</Link></Button>
        <Button asChild variant="secondary"><Link href="/director/learning-flows">Open ALTT Flows</Link></Button>
      </div>
      <Card><CardContent className="p-6 md:p-8"><BlueprintForm programs={programs} journeys={journeys.map((journey) => ({ id: journey.id, name: `${journey.program.name} v${journey.version}`, programId: journey.programId }))} /></CardContent></Card>
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-brand-dark">Blueprint Library</h2>
        {blueprints.length === 0 ? <DirectorEmptyState icon={Layers3} message="No blueprints exist yet. Create a blueprint to begin versioned planning for a program." /> : (
          <div className="grid gap-5 lg:grid-cols-2">
            {blueprints.map((blueprint) => (
              <Card key={blueprint.id}>
                <CardContent className="p-6">
                  <p className="text-sm font-black text-brand-red">{blueprint.status}</p>
                  <h3 className="mt-2 text-2xl font-black text-brand-dark">{blueprint.name}</h3>
                  <p className="mt-3 text-base font-semibold text-brand-muted">{blueprint.program.name} · Active v{blueprint.activeVersion}</p>
                  <div className="mt-5"><DuplicateBlueprintButton blueprintId={blueprint.id} /></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
