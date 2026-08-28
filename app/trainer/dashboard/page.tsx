import Link from "next/link";
import { Bell, BookOpen, Calendar, ClipboardCheck, FileText, MapPin, MessageSquare, Radio, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { CompleteClassForm } from "@/features/trainer/components/trainer-forms";
import { getTrainerDashboard, requireTrainer } from "@/server/trainer/queries";

function classAccess(location?: string | null) {
  if (!location) return null;
  if (/^https?:\/\//i.test(location)) {
    return <Button asChild className="mt-4"><a href={location} target="_blank" rel="noreferrer"><Radio className="h-5 w-5" />Join Class</a></Button>;
  }
  return <p className="mt-4 flex items-center gap-2 font-bold text-brand-dark"><MapPin className="h-5 w-5 text-brand-red" />{location}</p>;
}

function attendanceStatus(event: { status: string; attendanceSessions: Array<{ records: Array<unknown> }>; batch?: { enrollments: Array<unknown> } | null }) {
  if (event.status === "COMPLETED") return "Class completed";
  const records = event.attendanceSessions.flatMap((session) => session.records);
  if (records.length === 0) return "Attendance not started";
  const expected = event.batch?.enrollments.length ?? 0;
  return expected > 0 && records.length >= expected ? "Attendance completed" : "Attendance in progress";
}

export default async function TrainerDashboardPage() {
  const trainer = await requireTrainer();
  const dashboard = await getTrainerDashboard(trainer.id);
  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Trainer Workspace" title={`Good day, ${trainer.name}`} description="A simple operating view for classes, students, reviews and mentoring." />
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DirectorMetricCard label="Today's Classes" value={dashboard.stats.todaysClasses} icon={Calendar} />
        <DirectorMetricCard label="Today's Students" value={dashboard.stats.todaysStudents} icon={Users} />
        <DirectorMetricCard label="Pending Reviews" value={dashboard.stats.pendingReviews} icon={FileText} />
        <DirectorMetricCard label="Pending Tasks" value={dashboard.stats.pendingTasks} icon={ClipboardCheck} />
        <DirectorMetricCard label="Pending Reflections" value={dashboard.stats.pendingReflections} icon={MessageSquare} />
        <DirectorMetricCard label="Pending Assessments" value={dashboard.stats.pendingAssessments} icon={BookOpen} />
        <DirectorMetricCard label="Upcoming Live Sessions" value={dashboard.stats.upcomingLiveSessions} icon={Calendar} />
        <DirectorMetricCard label="Attendance Today" value={`${dashboard.stats.attendanceToday}%`} icon={ClipboardCheck} />
        <DirectorMetricCard label="Student Engagement" value={`${dashboard.stats.studentEngagement}%`} icon={TrendingUp} />
      </section>
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-brand-red">Today</p>
              <h2 className="mt-2 text-2xl font-black text-brand-dark">Classes to run</h2>
            </div>
            <Button asChild variant="secondary"><Link href="/trainer/calendar">Schedule Class</Link></Button>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {dashboard.classesToday.map((event) => (
              <div key={event.id} className="rounded-lg bg-white p-5">
                <p className="text-sm font-black text-brand-red">{event.type.replaceAll("_", " ")}</p>
                <h3 className="mt-2 text-xl font-black text-brand-dark">{event.title}</h3>
                <p className="mt-2 font-bold text-brand-muted">{event.startsAt.toLocaleString()} - {event.batch?.name ?? "Batch"}</p>
                <p className="mt-2 text-sm font-black uppercase text-brand-muted">{attendanceStatus(event)}</p>
                {classAccess(event.location)}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild variant="secondary"><Link href="/trainer/attendance">Attendance</Link></Button>
                  {event.batchId ? <Button asChild variant="secondary"><Link href={`/trainer/batches/${event.batchId}`}>Open Batch</Link></Button> : null}
                </div>
                {event.status !== "COMPLETED" ? <CompleteClassForm eventId={event.id} /> : null}
              </div>
            ))}
            {dashboard.classesToday.length === 0 ? <p className="font-semibold text-brand-muted">No classes scheduled today.</p> : null}
          </div>
        </CardContent>
      </Card>
      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase text-brand-red">Pending Reviews</p>
                <h2 className="mt-2 text-2xl font-black text-brand-dark">Submissions waiting</h2>
              </div>
              <Button asChild variant="secondary"><Link href="/trainer/assignments">Open Reviews</Link></Button>
            </div>
            <div className="mt-5 space-y-3">
              {dashboard.pendingReviewItems.map((submission) => (
                <Link key={submission.id} href="/trainer/assignments" className="block rounded-lg bg-white p-4 transition hover:-translate-y-1 hover:shadow-soft">
                  <p className="font-black text-brand-dark">{submission.student.name}</p>
                  <p className="mt-1 text-sm font-bold text-brand-muted">{submission.activity?.title ?? submission.day.title} - {(submission.submittedAt ?? submission.updatedAt).toLocaleString()}</p>
                </Link>
              ))}
              {dashboard.pendingReviewItems.length === 0 ? <p className="font-semibold text-brand-muted">No submissions waiting for review.</p> : null}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase text-brand-red">Students Needing Attention</p>
                <h2 className="mt-2 text-2xl font-black text-brand-dark">Follow up today</h2>
              </div>
              <Button asChild variant="secondary"><Link href="/trainer/students">Students</Link></Button>
            </div>
            <div className="mt-5 space-y-3">
              {dashboard.studentsNeedingAttention.map((item) => (
                <Link key={item.studentId} href={`/trainer/students/${item.studentId}`} className="block rounded-lg bg-white p-4 transition hover:-translate-y-1 hover:shadow-soft">
                  <p className="font-black text-brand-dark">{item.studentName}</p>
                  <p className="mt-1 text-sm font-bold text-brand-muted">{item.batchName} - {item.reasons.join(", ")}</p>
                </Link>
              ))}
              {dashboard.studentsNeedingAttention.length === 0 ? <p className="font-semibold text-brand-muted">No academic follow-ups flagged today.</p> : null}
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <Card><CardContent className="p-6"><h2 className="text-2xl font-black text-brand-dark">Recent Questions</h2>{dashboard.concerns.length === 0 ? <p className="mt-4 font-semibold text-brand-muted">No open student concerns.</p> : dashboard.concerns.map((item) => <div key={item.id} className="mt-4 rounded-lg bg-white p-4"><p className="font-black text-brand-dark">{item.title}</p><p className="text-sm font-bold text-brand-muted">{item.student.name} - {item.batch?.name ?? "Batch"}</p></div>)}</CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center gap-3 text-brand-red"><Bell className="h-5 w-5" /><h2 className="text-2xl font-black text-brand-dark">Announcements</h2></div>{dashboard.announcements.length === 0 ? <p className="mt-4 font-semibold text-brand-muted">No trainer announcements yet.</p> : dashboard.announcements.map((item) => <div key={item.id} className="mt-4 rounded-lg bg-white p-4"><p className="font-black text-brand-dark">{item.title}</p><p className="text-sm font-bold text-brand-muted">{item.status} - {item.batch?.name ?? "All batches"}</p></div>)}</CardContent></Card>
      </section>
    </div>
  );
}
