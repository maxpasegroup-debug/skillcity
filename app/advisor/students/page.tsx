import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getAssignedAdvisorStudents } from "@/server/advisor/queries";

export default async function AdvisorStudentsPage() {
  const students = await getAssignedAdvisorStudents();
  return <div className="space-y-8"><DirectorPageHeader eyebrow="Academic Support" title="My students" description="Only students covered by your active direct or batch Advisor assignments appear here." /><div className="grid gap-4 lg:grid-cols-2">{students.map((student) => { const enrollment = student.enrollments[0]; return <Card key={student.id}><CardContent className="p-6"><h2 className="text-xl font-black">{student.name}</h2><p className="mt-2 font-semibold text-brand-muted">{enrollment?.program.name ?? "No active program"}</p><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="font-bold text-brand-muted">Batch</dt><dd className="mt-1 font-black">{enrollment?.batch?.name ?? "Not assigned"}</dd></div><div><dt className="font-bold text-brand-muted">Current day</dt><dd className="mt-1 font-black">{enrollment ? `Day ${enrollment.currentDay}` : "Not active"}</dd></div></dl></CardContent></Card>; })}{students.length === 0 ? <Card><CardContent className="p-6 font-semibold text-brand-muted">No assigned students.</CardContent></Card> : null}</div></div>;
}
