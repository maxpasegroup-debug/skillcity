import Link from "next/link";
import { BookOpen, GraduationCap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getAssignedAdvisorStudents } from "@/server/advisor/queries";
import { getCurrentUser } from "@/server/auth/session";

export default async function AdvisorDashboardPage() {
  const [students, actor] = await Promise.all([getAssignedAdvisorStudents(), getCurrentUser()]);
  const activeEnrollments = students.flatMap((student) => student.enrollments);
  const batches = new Set(activeEnrollments.map((enrollment) => enrollment.batchId).filter(Boolean));
  const programs = new Set(activeEnrollments.map((enrollment) => enrollment.programId));
  const designation = actor?.employeeProfile?.designation?.name ?? "Academic Advisor";

  return (
    <div className="space-y-8">
      <DirectorPageHeader eyebrow={designation} title="My student support" description="Assigned students, current programs, and the next academic follow-up in one focused workspace." />
      <section className="grid gap-4 sm:grid-cols-3">
        <DirectorMetricCard label="Assigned Students" value={students.length} icon={Users} />
        <DirectorMetricCard label="Active Programs" value={programs.size} icon={BookOpen} />
        <DirectorMetricCard label="Active Batches" value={batches.size} icon={GraduationCap} />
      </section>
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-black">Assigned students</h2><p className="mt-1 font-semibold text-brand-muted">Direct assignments take priority over inherited batch assignments.</p></div><Button asChild variant="secondary"><Link href="/advisor/students">View all</Link></Button></div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {students.slice(0, 6).map((student) => {
              const enrollment = student.enrollments[0];
              return <div key={student.id} className="rounded-lg border border-black/8 bg-white p-4"><p className="font-black">{student.name}</p><p className="mt-1 text-sm font-semibold text-brand-muted">{enrollment?.program.name ?? "No active program"}{enrollment?.batch ? ` / ${enrollment.batch.name}` : ""}</p></div>;
            })}
            {students.length === 0 ? <p className="font-semibold text-brand-muted">No effective student or batch assignment is active.</p> : null}
          </div>
        </CardContent>
      </Card>
      <Card><CardContent className="p-6"><h2 className="text-xl font-black">SIA guidance</h2><p className="mt-2 font-semibold leading-7 text-brand-muted">Advisor-specific AI access is not enabled yet. SIA will not inspect student records or propose interventions until an Advisor AI scope is explicitly approved.</p></CardContent></Card>
    </div>
  );
}
