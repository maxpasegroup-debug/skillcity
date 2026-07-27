import { Activity, BarChart3, CalendarCheck, Gauge, Radio, UserMinus, Users } from "lucide-react";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getDirectorDashboard } from "@/server/director/queries";

export default async function DirectorAnalyticsPage() {
  const dashboard = await getDirectorDashboard();

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Analytics" title="Executive learning analytics" description="Simple operational cards focused on progress, attendance, engagement, and risk." />
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <DirectorMetricCard label="Program Completion" value={`${dashboard.stats.studentCompletion}%`} icon={BarChart3} />
        <DirectorMetricCard label="Attendance" value={`${dashboard.stats.attendance}%`} icon={CalendarCheck} />
        <DirectorMetricCard label="Student Engagement" value={`${dashboard.stats.journeyHealth}%`} icon={Users} />
        <DirectorMetricCard label="Activity Completion" value={`${dashboard.stats.studentCompletion}%`} icon={Activity} />
        <DirectorMetricCard label="Average Progress" value={`${dashboard.stats.journeyHealth}%`} icon={Gauge} />
        <DirectorMetricCard label="Live Attendance" value={`${dashboard.stats.attendance}%`} icon={Radio} />
        <DirectorMetricCard label="Inactive Students" value={dashboard.stats.inactiveStudents} icon={UserMinus} />
      </section>
    </div>
  );
}
