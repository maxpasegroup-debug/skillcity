import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { AdminFollowUpForm, FollowUpStatusForm } from "@/features/admin/components/admin-follow-up-forms";
import { getAdminFollowUps } from "@/server/admin/queries";

export const dynamic = "force-dynamic";

function metadataObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function textValue(value: unknown, fallback = "Not set") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function formatDate(date?: Date | null) {
  if (!date) return "No date";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function attentionReasons(enrollment: {
  studentId: string;
  student: {
    attendanceRecords: Array<{ status: string }>;
    submissions: Array<{ status: string; updatedAt: Date }>;
    progress: Array<{ updatedAt: Date }>;
  };
  batch: {
    activities: Array<{
      dueAt: Date | null;
      progress: Array<{ studentId: string; status: string }>;
    }>;
  } | null;
}) {
  const now = new Date();
  const attended = enrollment.student.attendanceRecords.filter((record) => record.status === "PRESENT" || record.status === "LATE").length;
  const attendancePercent = enrollment.student.attendanceRecords.length === 0 ? null : Math.round((attended / enrollment.student.attendanceRecords.length) * 100);
  const overdueTasks = enrollment.batch?.activities.filter((activity) => activity.dueAt && activity.dueAt < now && !activity.progress.some((progress) => progress.studentId === enrollment.studentId && progress.status === "COMPLETED")).length ?? 0;
  const pendingSubmissions = enrollment.student.submissions.filter((submission) => submission.status === "SUBMITTED").length;
  const lastProgressAt = enrollment.student.progress[0]?.updatedAt;
  const lastSubmissionAt = enrollment.student.submissions[0]?.updatedAt;
  const lastActivityAt = [lastProgressAt, lastSubmissionAt].filter(Boolean).sort((a, b) => Number(b) - Number(a))[0];
  const staleDate = new Date(now);
  staleDate.setDate(staleDate.getDate() - 14);

  return [
    attendancePercent !== null && attendancePercent < 75 ? `Attendance ${attendancePercent}%` : null,
    overdueTasks > 1 ? `${overdueTasks} overdue tasks` : null,
    pendingSubmissions > 0 ? `${pendingSubmissions} pending reviews` : null,
    !lastActivityAt || lastActivityAt < staleDate ? "No recent activity" : null
  ].filter(Boolean) as string[];
}

export default async function AdminFollowUpsPage() {
  const data = await getAdminFollowUps();
  const studentOptions = Array.from(new Map(data.health.enrollments.map((enrollment) => [enrollment.studentId, enrollment.student.name])).entries()).map(([id, name]) => ({ id, name }));
  const batchOptions = Array.from(new Map(data.health.batches.map((batch) => [batch.id, `${batch.name} - ${batch.program.name}`])).entries()).map(([id, name]) => ({ id, name }));
  const ownerOptions = data.owners.map((owner) => ({ id: owner.id, name: owner.name, role: owner.roles[0]?.role.name ?? "Staff" }));
  const attentionList = data.health.enrollments.map((enrollment) => ({ enrollment, reasons: attentionReasons(enrollment) })).filter((item) => item.reasons.length > 0).slice(0, 12);

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Admin Follow-ups" title="Operational follow-up queue" description="Assign, track and resolve academic follow-ups without creating a separate CRM." />

      <section className="grid gap-5 sm:grid-cols-3">
        <DirectorMetricCard label="Open" value={data.stats.open} icon={AlertTriangle} />
        <DirectorMetricCard label="Due Today" value={data.stats.dueToday} icon={Clock} />
        <DirectorMetricCard label="Resolved" value={data.stats.resolved} icon={CheckCircle2} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-black uppercase text-brand-red">Create Follow-up</p>
            <h2 className="mt-2 text-2xl font-black text-brand-dark">Record next action</h2>
            <div className="mt-5">
              <AdminFollowUpForm students={studentOptions} batches={batchOptions} owners={ownerOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-black uppercase text-brand-red">Academic Health</p>
            <h2 className="mt-2 text-2xl font-black text-brand-dark">Students needing attention</h2>
            <div className="mt-5 space-y-3">
              {attentionList.map(({ enrollment, reasons }) => (
                <Link key={enrollment.id} href="/admin/academic-health" className="block rounded-lg bg-white p-4 transition hover:-translate-y-1 hover:shadow-soft">
                  <p className="font-black text-brand-dark">{enrollment.student.name}</p>
                  <p className="mt-1 text-sm font-bold text-brand-muted">{enrollment.batch?.name ?? "Batch"} - {reasons.join(", ")}</p>
                </Link>
              ))}
              {attentionList.length === 0 ? <p className="font-semibold text-brand-muted">No academic health follow-ups flagged.</p> : null}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="p-6">
          <p className="text-sm font-black uppercase text-brand-red">Follow-up Log</p>
          <h2 className="mt-2 text-2xl font-black text-brand-dark">Open and recent actions</h2>
          <div className="mt-5 grid gap-4">
            {data.followUps.map((followUp) => {
              const metadata = metadataObject(followUp.metadata);
              const status = textValue(metadata.status, followUp.status === "SENT" ? "RESOLVED" : "OPEN");
              return (
                <div key={followUp.id} className="rounded-lg bg-white p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-black uppercase text-brand-red">{status.replaceAll("_", " ")}</p>
                      <h3 className="mt-2 text-xl font-black text-brand-dark">{textValue(metadata.nextAction, "Follow up")}</h3>
                      <p className="mt-2 font-semibold text-brand-muted">{followUp.message}</p>
                      <p className="mt-2 text-sm font-bold text-brand-muted">Owner: {followUp.user?.name ?? "Admin"} - Priority: {textValue(metadata.priority, "NORMAL")} - Due: {formatDate(followUp.scheduledAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-brand-beige px-3 py-2 text-sm font-black text-brand-dark">
                      <UserCheck className="h-4 w-4 text-brand-red" />
                      {followUp.status}
                    </div>
                  </div>
                  <FollowUpStatusForm followUpId={followUp.id} currentStatus={status} />
                </div>
              );
            })}
            {data.followUps.length === 0 ? <p className="font-semibold text-brand-muted">No operational follow-ups yet.</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
