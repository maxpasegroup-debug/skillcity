import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, ClipboardCheck, FileText, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { StudentConcernForm } from "@/features/trainer/components/trainer-forms";
import { getTrainerStudentAcademicDetail, requireTrainer } from "@/server/trainer/queries";

function attendanceLabel(records: Array<{ status: string }>) {
  if (records.length === 0) return { label: "Not started", percent: null };
  const attended = records.filter((item) => item.status === "PRESENT" || item.status === "LATE").length;
  const percent = Math.round((attended / records.length) * 100);
  return { label: `${attended}/${records.length} - ${percent}%`, percent };
}

function formatDate(date?: Date | null) {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default async function TrainerStudentDetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  const trainer = await requireTrainer();
  const { studentId } = await params;
  const enrollment = await getTrainerStudentAcademicDetail(trainer.id, studentId);
  if (!enrollment) notFound();

  const attendance = attendanceLabel(enrollment.student.attendanceRecords);
  const completedProgress = enrollment.student.progress.filter((item) => item.status === "COMPLETED").length;
  const submitted = enrollment.student.submissions.filter((item) => item.status === "SUBMITTED");
  const overdue = enrollment.batch?.activities.filter((activity) => activity.dueAt && activity.dueAt < new Date() && !activity.progress.some((progress) => progress.studentId === studentId && progress.status === "COMPLETED")) ?? [];
  const needsAttention = (attendance.percent !== null && attendance.percent < 75) || overdue.length > 1 || submitted.length > 0;

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow={enrollment.program.name} title={enrollment.student.name} description="Trainer-facing academic profile for attendance, progress, tasks and submissions." />

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DirectorMetricCard label="Batch" value={enrollment.batch?.name ?? "Not assigned"} icon={GraduationCap} />
        <DirectorMetricCard label="Attendance" value={attendance.label} icon={ClipboardCheck} />
        <DirectorMetricCard label="Completed Progress" value={completedProgress} icon={CheckCircle2} />
        <DirectorMetricCard label="Pending Reviews" value={submitted.length} icon={FileText} />
      </section>

      {needsAttention ? (
        <Card>
          <CardContent className="flex gap-4 p-6">
            <AlertTriangle className="mt-1 h-6 w-6 shrink-0 text-brand-red" />
            <div>
              <p className="text-sm font-black uppercase text-brand-red">Needs Attention</p>
              <h2 className="mt-2 text-2xl font-black text-brand-dark">Follow up with this student</h2>
              <p className="mt-2 font-semibold text-brand-muted">{overdue.length} overdue tasks, {submitted.length} submissions waiting for review, attendance {attendance.label}.</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {enrollment.batch ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-black uppercase text-brand-red">Trainer Follow-Up</p>
            <h2 className="mt-2 text-2xl font-black text-brand-dark">Record next action</h2>
            <div className="mt-5">
              <StudentConcernForm batches={[{ id: enrollment.batch.id, name: enrollment.batch.name }]} students={[{ id: enrollment.student.id, name: enrollment.student.name }]} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-black uppercase text-brand-red">Tasks</p>
            <h2 className="mt-2 text-2xl font-black text-brand-dark">Task health</h2>
            <div className="mt-5 space-y-3">
              {enrollment.batch?.activities.map((activity) => {
                const submission = enrollment.student.submissions.find((item) => item.activityId === activity.id);
                const completed = activity.progress.some((item) => item.studentId === studentId && item.status === "COMPLETED");
                const status = completed ? "COMPLETED" : submission?.status ?? (activity.dueAt && activity.dueAt < new Date() ? "OVERDUE" : "PENDING");
                return (
                  <div key={activity.id} className="rounded-lg bg-white p-4">
                    <p className="text-sm font-black text-brand-red">{status}</p>
                    <p className="mt-1 font-black text-brand-dark">{activity.title}</p>
                    <p className="mt-1 text-sm font-bold text-brand-muted">Due {formatDate(activity.dueAt)}</p>
                  </div>
                );
              })}
              {enrollment.batch?.activities.length === 0 ? <p className="font-semibold text-brand-muted">No batch tasks assigned yet.</p> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-black uppercase text-brand-red">Submissions</p>
            <h2 className="mt-2 text-2xl font-black text-brand-dark">Recent work</h2>
            <div className="mt-5 space-y-3">
              {enrollment.student.submissions.map((submission) => (
                <div key={submission.id} className="rounded-lg bg-white p-4">
                  <p className="text-sm font-black text-brand-red">{submission.status}</p>
                  <p className="mt-1 font-black text-brand-dark">{submission.title}</p>
                  <p className="mt-1 text-sm font-bold text-brand-muted">{submission.activity?.title ?? submission.day.title} - {formatDate(submission.submittedAt)}</p>
                  {submission.url ? <a href={submission.url} target="_blank" rel="noreferrer" className="mt-2 block break-all font-bold text-brand-red">Open submission</a> : null}
                </div>
              ))}
              {enrollment.student.submissions.length === 0 ? <p className="font-semibold text-brand-muted">No submissions yet.</p> : null}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="p-6">
          <p className="text-sm font-black uppercase text-brand-red">Recent Attendance</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {enrollment.student.attendanceRecords.slice(0, 10).map((record) => (
              <div key={record.id} className="rounded-lg bg-white p-4">
                <p className="font-black text-brand-dark">{record.session.title}</p>
                <p className="mt-1 text-sm font-bold text-brand-muted">{record.status} - {formatDate(record.session.sessionDate)}</p>
              </div>
            ))}
            {enrollment.student.attendanceRecords.length === 0 ? <p className="font-semibold text-brand-muted">No attendance recorded yet.</p> : null}
          </div>
          <Link href={`/trainer/batches/${enrollment.batchId}`} className="mt-6 inline-block font-black text-brand-red">Back to batch</Link>
        </CardContent>
      </Card>
    </div>
  );
}
