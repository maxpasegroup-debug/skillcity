import { ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BatchForm } from "@/features/director/components/director-forms";
import { DirectorEmptyState } from "@/features/director/components/director-empty-state";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getDirectorBatches, getDirectorPlanner, getDirectorPrograms } from "@/server/director/queries";

export default async function DirectorBatchManagementPage() {
  const [batches, programs, journeys] = await Promise.all([getDirectorBatches(), getDirectorPrograms(), getDirectorPlanner()]);

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Batch Management" title="Create and manage batches" description="Assign each batch to a program, journey, schedule, capacity, and trainer plan." />
      <Card><CardContent className="p-6 md:p-8"><BatchForm programs={programs} journeys={journeys.map((journey) => ({ id: journey.id, name: `${journey.program.name} v${journey.version}`, programId: journey.programId }))} /></CardContent></Card>
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-brand-dark">Batches</h2>
        {batches.length === 0 ? <DirectorEmptyState icon={ClipboardList} message="No batches are active yet. Create a batch to start assigning students and trainers." /> : (
          <div className="grid gap-5 lg:grid-cols-2">
            {batches.map((batch) => (
              <Card key={batch.id}>
                <CardContent className="p-6">
                  <p className="text-sm font-black text-brand-red">{batch.status}</p>
                  <h3 className="mt-2 text-2xl font-black text-brand-dark">{batch.name}</h3>
                  <div className="mt-4 grid gap-3 text-sm font-bold text-brand-muted sm:grid-cols-2">
                    <p>{batch.program.name}</p>
                    <p>{batch.journey ? `Journey v${batch.journey.version}` : "Journey not assigned"}</p>
                    <p>{batch.enrollments.length} students</p>
                    <p>Limit {batch.enrollmentLimit ?? "Open"}</p>
                    <p>{batch.trainerAssignments.length} trainers</p>
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
