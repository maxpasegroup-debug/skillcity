import { Bell, BookOpen, Calendar, ClipboardCheck, FileText, MessageSquare, TrendingUp, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getTrainerDashboard, requireTrainer } from "@/server/trainer/queries";

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
        <DirectorMetricCard label="Pending Reflections" value={dashboard.stats.pendingReflections} icon={MessageSquare} />
        <DirectorMetricCard label="Pending Assessments" value={dashboard.stats.pendingAssessments} icon={BookOpen} />
        <DirectorMetricCard label="Upcoming Live Sessions" value={dashboard.stats.upcomingLiveSessions} icon={Calendar} />
        <DirectorMetricCard label="Attendance Today" value={`${dashboard.stats.attendanceToday}%`} icon={ClipboardCheck} />
        <DirectorMetricCard label="Student Engagement" value={`${dashboard.stats.studentEngagement}%`} icon={TrendingUp} />
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <Card><CardContent className="p-6"><h2 className="text-2xl font-black text-brand-dark">Recent Questions</h2>{dashboard.concerns.length === 0 ? <p className="mt-4 font-semibold text-brand-muted">No open student concerns.</p> : dashboard.concerns.map((item) => <div key={item.id} className="mt-4 rounded-lg bg-white p-4"><p className="font-black text-brand-dark">{item.title}</p><p className="text-sm font-bold text-brand-muted">{item.student.name} - {item.batch?.name ?? "Batch"}</p></div>)}</CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center gap-3 text-brand-red"><Bell className="h-5 w-5" /><h2 className="text-2xl font-black text-brand-dark">Announcements</h2></div>{dashboard.announcements.length === 0 ? <p className="mt-4 font-semibold text-brand-muted">No trainer announcements yet.</p> : dashboard.announcements.map((item) => <div key={item.id} className="mt-4 rounded-lg bg-white p-4"><p className="font-black text-brand-dark">{item.title}</p><p className="text-sm font-bold text-brand-muted">{item.status} - {item.batch?.name ?? "All batches"}</p></div>)}</CardContent></Card>
      </section>
    </div>
  );
}
