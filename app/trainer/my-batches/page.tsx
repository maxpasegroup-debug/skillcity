import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getTrainerWorkspaceData, requireTrainer } from "@/server/trainer/queries";

export default async function TrainerBatchesPage() {
  const trainer = await requireTrainer();
  const { batches } = await getTrainerWorkspaceData(trainer.id);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="My Batches" title="Assigned batches" description="View students, journey position, progress, attendance and performance for each assigned batch." /><div className="grid gap-5 lg:grid-cols-2">{batches.map((batch) => <Card key={batch.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{batch.program.name}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{batch.name}</h2><p className="mt-2 font-bold text-brand-muted">{batch.journey?.name ?? "Journey pending"} - {batch.enrollments.length} students</p><div className="mt-5 space-y-2">{batch.enrollments.slice(0, 5).map((enrollment) => <div key={enrollment.id} className="rounded-lg bg-white p-3"><p className="font-bold text-brand-dark">{enrollment.student.name}</p><p className="text-sm font-semibold text-brand-muted">Day {enrollment.currentDay} - {enrollment.status}</p></div>)}</div></CardContent></Card>)}</div></div>;
}
