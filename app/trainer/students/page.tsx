import { Card, CardContent } from "@/components/ui/card";
import { StudentConcernForm } from "@/features/trainer/components/trainer-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getTrainerWorkspaceData, requireTrainer } from "@/server/trainer/queries";

export default async function StudentsPage() {
  const trainer = await requireTrainer();
  const { batches, concerns } = await getTrainerWorkspaceData(trainer.id);
  const students = batches.flatMap((batch) => batch.enrollments.map((enrollment) => ({ id: enrollment.student.id, name: `${enrollment.student.name} - ${batch.name}` })));
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Students" title="Student support" description="View assigned students, flag concerns, and recommend Tara follow-up." /><Card><CardContent className="p-6"><StudentConcernForm batches={batches} students={students} /></CardContent></Card><div className="grid gap-5 lg:grid-cols-2">{concerns.map((concern) => <Card key={concern.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{concern.status}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{concern.title}</h2><p className="mt-2 font-bold text-brand-muted">{concern.student.name} - {concern.batch?.name ?? "Batch"}</p><p className="mt-3 leading-7 text-brand-muted">{concern.notes}</p></CardContent></Card>)}</div></div>;
}
