import { Card, CardContent } from "@/components/ui/card";
import { AttendanceRecordForm, AttendanceSessionForm } from "@/features/trainer/components/trainer-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getTrainerWorkspaceData, requireTrainer } from "@/server/trainer/queries";

export default async function AttendancePage() {
  const trainer = await requireTrainer();
  const { batches, attendanceSessions } = await getTrainerWorkspaceData(trainer.id);
  const students = batches.flatMap((batch) => batch.enrollments.map((enrollment) => ({ id: enrollment.student.id, name: `${enrollment.student.name} - ${batch.name}` })));
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Attendance" title="Class attendance" description="Record Present, Absent, Late and Excused attendance for assigned batches." /><Card><CardContent className="p-6"><AttendanceSessionForm batches={batches} /></CardContent></Card><Card><CardContent className="p-6"><AttendanceRecordForm sessions={attendanceSessions.map((session) => ({ id: session.id, name: `${session.title} - ${session.batch.name}` }))} students={students} /></CardContent></Card><div className="grid gap-5 lg:grid-cols-2">{attendanceSessions.map((session) => <Card key={session.id}><CardContent className="p-6"><h2 className="text-2xl font-black text-brand-dark">{session.title}</h2><p className="mt-2 font-bold text-brand-muted">{session.sessionDate.toLocaleString()} - {session.batch.name}</p><p className="mt-2 text-sm font-bold text-brand-muted">{session.records.length} attendance records</p></CardContent></Card>)}</div></div>;
}
