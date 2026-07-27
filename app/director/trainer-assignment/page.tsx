import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TrainerAssignmentForm } from "@/features/director/components/director-forms";
import { DirectorEmptyState } from "@/features/director/components/director-empty-state";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getDirectorTrainersAndBatches } from "@/server/director/queries";

export default async function DirectorTrainerAssignmentPage() {
  const [trainers, batches, assignments] = await getDirectorTrainersAndBatches();

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Trainer Assignment" title="Assign trainers to batches" description="Support one trainer across multiple batches and multiple trainers on one batch." />
      <Card><CardContent className="p-6 md:p-8"><TrainerAssignmentForm trainers={trainers} batches={batches} /></CardContent></Card>
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-brand-dark">Assignments</h2>
        {assignments.length === 0 ? <DirectorEmptyState icon={Users} message="No trainer assignments yet. Trainers with the Trainer role will appear in the assignment form." /> : (
          <div className="grid gap-4 lg:grid-cols-2">
            {assignments.map((assignment) => (
              <Card key={assignment.id}><CardContent className="p-6"><h3 className="text-xl font-black text-brand-dark">{assignment.trainer.name}</h3><p className="mt-2 text-base font-bold text-brand-muted">{assignment.role} · {assignment.batch.name} · {assignment.batch.program.name}</p></CardContent></Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
