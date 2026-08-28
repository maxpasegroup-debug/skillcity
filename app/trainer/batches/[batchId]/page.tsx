import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, ClipboardCheck, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { CompleteClassForm } from "@/features/trainer/components/trainer-forms";
import { getTrainerBatchDetail, requireTrainer } from "@/server/trainer/queries";

function formatDate(date?: Date | null) {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function attendanceHealth(records: Array<{ status: string }>) {
  if (records.length === 0) return { label: "Not started", percent: null };
  const attended = records.filter((item) => item.status === "PRESENT" || item.status === "LATE").length;
  const percent = Math.round((attended / records.length) * 100);
  return { label: `${attended} / ${records.length} - ${percent}%`, percent };
}

function studentTaskCounts(studentId: string, tasks: Array<{ dueAt: Date | null; submissions: Array<{ studentId: string; status: string }>; progress: Array<{ studentId: string; status: string }> }>) {
  const now = new Date();
  return tasks.reduce(
    (total, task) => {
      const completed = task.progress.some((item) => item.studentId === studentId && item.status === "COMPLETED") || task.submissions.some((item) => item.studentId === studentId && item.status === "APPROVED");
      const submitted = task.submissions.some((item) => item.studentId === studentId && item.status === "SUBMITTED");
      if (completed) total.completed += 1;
      else if (submitted) total.submitted += 1;
      else if (task.dueAt && task.dueAt < now) total.overdue += 1;
      else total.pending += 1;
      return total;
    },
    { pending: 0, submitted: 0, completed: 0, overdue: 0 }
  );
}

export default async function TrainerBatchDetailPage({ params }: { params: Promise<{ batchId: string }> }) {
  const trainer = await requireTrainer();
  const { batchId } = await params;
  const batch = await getTrainerBatchDetail(trainer.id, batchId);
  if (!batch) notFound();

  const todayClass = batch.calendarEvents[0] ?? null;
  const attendanceRecords = batch.enrollments.flatMap((enrollment) => enrollment.student.attendanceRecords);
  const attendance = attendanceHealth(attendanceRecords);
  const submittedReviews = batch.activities.reduce((total, task) => total + task.submissions.filter((submission) => submission.status === "SUBMITTED").length, 0);
  const completedTasks = batch.activities.filter((task) => task.progress.some((progress) => progress.status === "COMPLETED")).length;
  const overdueTasks = batch.activities.filter((task) => task.dueAt && task.dueAt < new Date() && !task.progress.some((progress) => progress.status === "COMPLETED")).length;

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow={batch.program.name} title={batch.name} description="Batch operations for classes, attendance, tasks, submissions, progress and student attention." />

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DirectorMetricCard label="Students" value={batch.enrollments.length} icon={Users} />
        <DirectorMetricCard label="Capacity" value={batch.enrollmentLimit ? `${batch.enrollments.length}/${batch.enrollmentLimit}` : "Open"} icon={ClipboardCheck} />
        <DirectorMetricCard label="Attendance" value={attendance.label} icon={CheckCircle2} />
        <DirectorMetricCard label="Pending Reviews" value={submittedReviews} icon={FileText} />
      </section>

      <Card>
        <CardContent className="p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <p className="text-sm font-black uppercase text-brand-red">Today</p>
              <h2 className="mt-2 text-2xl font-black text-brand-dark">{todayClass?.title ?? "No class scheduled"}</h2>
              <p className="mt-2 font-bold text-brand-muted">{todayClass ? formatDate(todayClass.startsAt) : "Schedule the next class from trainer calendar."}</p>
              {todayClass ? <p className="mt-2 text-sm font-black uppercase text-brand-muted">{todayClass.status.replaceAll("_", " ")}</p> : null}
              {todayClass?.location ? <p className="mt-3 break-all font-bold text-brand-dark">{todayClass.location}</p> : null}
              {todayClass && todayClass.status !== "COMPLETED" ? <CompleteClassForm eventId={todayClass.id} /> : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <Button asChild><Link href="/trainer/attendance">Mark Attendance</Link></Button>
              <Button asChild variant="secondary"><Link href="/trainer/calendar">Schedule Class</Link></Button>
              <Button asChild variant="secondary"><Link href="/trainer/assignments">Create Task</Link></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-5 lg:grid-cols-3">
        <Card><CardContent className="p-6"><p className="text-sm font-black text-brand-red">TASKS</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{completedTasks}/{batch.activities.length}</h2><p className="mt-2 font-bold text-brand-muted">Completed batch tasks</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm font-black text-brand-red">OVERDUE</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{overdueTasks}</h2><p className="mt-2 font-bold text-brand-muted">Tasks need follow-up</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm font-black text-brand-red">TRAINER</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{batch.trainerAssignments.map((item) => item.trainer.name).join(", ") || "Not assigned"}</h2><p className="mt-2 font-bold text-brand-muted">{formatDate(batch.startsAt)} start</p></CardContent></Card>
      </section>

      <Card>
        <CardContent className="p-6">
          <p className="text-sm font-black uppercase text-brand-red">Students</p>
          <h2 className="mt-2 text-2xl font-black text-brand-dark">Academic health</h2>
          <div className="mt-5 grid gap-4">
            {batch.enrollments.map((enrollment) => {
              const studentAttendance = attendanceHealth(enrollment.student.attendanceRecords);
              const taskCounts = studentTaskCounts(enrollment.studentId, batch.activities);
              const needsAttention = (studentAttendance.percent !== null && studentAttendance.percent < 75) || taskCounts.overdue > 1 || taskCounts.submitted > 0;
              return (
                <Link key={enrollment.id} href={`/trainer/students/${enrollment.studentId}`} className="rounded-lg bg-white p-4 transition hover:-translate-y-1 hover:shadow-soft">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-black text-brand-dark">{enrollment.student.name}</p>
                      <p className="mt-1 text-sm font-bold text-brand-muted">Day {enrollment.currentDay} - Attendance {studentAttendance.label}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-black">
                      <span className="rounded-full bg-brand-beige px-3 py-1 text-brand-dark">Pending {taskCounts.pending}</span>
                      <span className="rounded-full bg-brand-beige px-3 py-1 text-brand-dark">Submitted {taskCounts.submitted}</span>
                      <span className="rounded-full bg-brand-beige px-3 py-1 text-brand-dark">Overdue {taskCounts.overdue}</span>
                      {needsAttention ? <span className="rounded-full bg-red-50 px-3 py-1 text-brand-red"><AlertTriangle className="mr-1 inline h-3 w-3" />Needs attention</span> : null}
                    </div>
                  </div>
                </Link>
              );
            })}
            {batch.enrollments.length === 0 ? <p className="font-semibold text-brand-muted">No students assigned to this batch yet.</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
