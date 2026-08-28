import Link from "next/link";
import { AlertTriangle, CheckCircle2, FileText, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getAdminAcademicHealth } from "@/server/admin/queries";

function attendance(records: Array<{ status: string }>) {
  if (records.length === 0) return { label: "Not started", percent: null };
  const attended = records.filter((record) => record.status === "PRESENT" || record.status === "LATE").length;
  const percent = Math.round((attended / records.length) * 100);
  return { label: `${attended}/${records.length} - ${percent}%`, percent };
}

function reasonsFor(enrollment: Awaited<ReturnType<typeof getAdminAcademicHealth>>["enrollments"][number]) {
  const now = new Date();
  const studentAttendance = attendance(enrollment.student.attendanceRecords);
  const overdueTasks = enrollment.batch?.activities.filter((activity) => activity.dueAt && activity.dueAt < now && !activity.progress.some((progress) => progress.studentId === enrollment.studentId && progress.status === "COMPLETED")).length ?? 0;
  const pendingSubmissions = enrollment.student.submissions.filter((submission) => submission.status === "SUBMITTED").length;
  const lastProgressAt = enrollment.student.progress[0]?.updatedAt;
  const lastSubmissionAt = enrollment.student.submissions[0]?.updatedAt;
  const lastActivityAt = [lastProgressAt, lastSubmissionAt].filter(Boolean).sort((a, b) => Number(b) - Number(a))[0];
  const staleDate = new Date(now);
  staleDate.setDate(staleDate.getDate() - 14);

  const reasons: string[] = [];
  if (studentAttendance.percent !== null && studentAttendance.percent < 75) reasons.push("Low attendance");
  if (overdueTasks > 1) reasons.push(`${overdueTasks} overdue tasks`);
  if (pendingSubmissions > 0) reasons.push(`${pendingSubmissions} pending reviews`);
  if (!lastActivityAt || lastActivityAt < staleDate) reasons.push("No recent activity");
  return { reasons, attendance: studentAttendance, overdueTasks, pendingSubmissions };
}

export default async function AdminAcademicHealthPage({
  searchParams
}: {
  searchParams: Promise<{ programId?: string; batchId?: string; trainerId?: string }>;
}) {
  const filters = await searchParams;
  const data = await getAdminAcademicHealth(filters);
  const healthRows = data.enrollments.map((enrollment) => ({ enrollment, health: reasonsFor(enrollment) }));
  const needingAttention = healthRows.filter((row) => row.health.reasons.length > 0);

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Academic Health" title="Students needing attention" description="Operational view of low attendance, overdue tasks, pending reviews and no recent activity." />

      <form className="grid gap-4 rounded-lg bg-white/90 p-5 shadow-soft md:grid-cols-4">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-brand-dark">Program</span>
          <select name="programId" defaultValue={filters.programId ?? ""} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold text-brand-dark">
            <option value="">All programs</option>
            {data.programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-brand-dark">Batch</span>
          <select name="batchId" defaultValue={filters.batchId ?? ""} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold text-brand-dark">
            <option value="">All batches</option>
            {data.batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name} - {batch.program.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-brand-dark">Trainer</span>
          <select name="trainerId" defaultValue={filters.trainerId ?? ""} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold text-brand-dark">
            <option value="">All trainers</option>
            {data.trainers.map((trainer) => <option key={trainer.id} value={trainer.id}>{trainer.name}</option>)}
          </select>
        </label>
        <button className="mt-7 h-12 rounded-lg bg-brand-red px-5 font-black text-white">Apply Filters</button>
      </form>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DirectorMetricCard label="Active Students" value={data.enrollments.length} icon={GraduationCap} />
        <DirectorMetricCard label="Need Attention" value={needingAttention.length} icon={AlertTriangle} />
        <DirectorMetricCard label="Pending Reviews" value={healthRows.reduce((sum, row) => sum + row.health.pendingSubmissions, 0)} icon={FileText} />
        <DirectorMetricCard label="Healthy" value={healthRows.length - needingAttention.length} icon={CheckCircle2} />
      </section>

      <Card>
        <CardContent className="p-6">
          <p className="text-sm font-black uppercase text-brand-red">Action Required</p>
          <h2 className="mt-2 text-2xl font-black text-brand-dark">Student academic health queue</h2>
          <div className="mt-5 grid gap-4">
            {healthRows.map(({ enrollment, health }) => (
              <div key={enrollment.id} className="rounded-lg bg-white p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-black text-brand-dark">{enrollment.student.name}</p>
                    <p className="mt-1 text-sm font-bold text-brand-muted">{enrollment.program.name} - {enrollment.batch?.name ?? "Batch pending"} - {enrollment.batch?.trainerAssignments.map((item) => item.trainer.name).join(", ") || "Trainer pending"}</p>
                    <p className="mt-1 text-sm font-bold text-brand-muted">Attendance {health.attendance.label}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(health.reasons.length > 0 ? health.reasons : ["No active concern"]).map((reason) => (
                      <span key={reason} className={`rounded-full px-3 py-1 text-xs font-black ${health.reasons.length > 0 ? "bg-red-50 text-brand-red" : "bg-brand-beige text-brand-dark"}`}>{reason}</span>
                    ))}
                  </div>
                </div>
                {enrollment.batchId ? <Link href={`/trainer/batches/${enrollment.batchId}`} className="mt-3 inline-block font-black text-brand-red">Open batch</Link> : null}
              </div>
            ))}
            {healthRows.length === 0 ? <p className="font-semibold text-brand-muted">No active student enrollments match these filters.</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
