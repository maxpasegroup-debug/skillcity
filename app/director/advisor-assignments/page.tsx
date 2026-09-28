import { UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AdvisorAssignmentForm, EndAdvisorAssignmentForm } from "@/features/advisors/components/advisor-assignment-form";
import { DirectorEmptyState } from "@/features/director/components/director-empty-state";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getAdvisorAssignmentManagement } from "@/server/advisor/queries";

function formatDate(value: Date | null) {
  return value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(value) : "Open-ended";
}

export default async function DirectorAdvisorAssignmentsPage() {
  const [advisors, students, batches, assignments] = await getAdvisorAssignmentManagement();
  const advisorOptions = advisors.map((advisor) => ({ id: advisor.id, name: `${advisor.user.name}${advisor.employeeCode ? ` (${advisor.employeeCode})` : ""}` }));
  const studentOptions = students.map((student) => ({ id: student.id, name: student.name }));
  const batchOptions = batches.map((batch) => ({ id: batch.id, name: `${batch.program.name} / ${batch.name}` }));

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Academic Support" title="Academic advisor assignments" description="Assign Employee-backed academic advisors to a student or batch with effective dates and preserved history." />
      <section className="grid gap-5 xl:grid-cols-2">
        <Card><CardContent className="p-6 md:p-8"><h2 className="mb-5 text-xl font-black text-brand-dark">Student Assignment</h2><AdvisorAssignmentForm targetType="STUDENT" advisors={advisorOptions} targets={studentOptions} /></CardContent></Card>
        <Card><CardContent className="p-6 md:p-8"><h2 className="mb-5 text-xl font-black text-brand-dark">Batch Assignment</h2><AdvisorAssignmentForm targetType="BATCH" advisors={advisorOptions} targets={batchOptions} /></CardContent></Card>
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-brand-dark">Assignment History</h2>
        {assignments.length === 0 ? <DirectorEmptyState icon={UserCheck} message="No academic advisor assignments are recorded yet." /> : (
          <div className="grid gap-4 lg:grid-cols-2">
            {assignments.map((assignment) => (
              <Card key={assignment.id}><CardContent className="space-y-3 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h3 className="text-xl font-black text-brand-dark">{assignment.advisor.user.name}</h3><p className="mt-1 font-bold text-brand-muted">{assignment.student?.name ?? (assignment.batch ? `${assignment.batch.program.name} / ${assignment.batch.name}` : "Unavailable target")}</p></div>
                  <span className="rounded-full bg-brand-beige px-3 py-1 text-xs font-black text-brand-dark">{assignment.status}</span>
                </div>
                <p className="text-sm font-semibold text-brand-muted">{formatDate(assignment.startsAt)} to {formatDate(assignment.endsAt)}</p>
                {assignment.status === "ACTIVE" ? <EndAdvisorAssignmentForm assignmentId={assignment.id} /> : null}
              </CardContent></Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
