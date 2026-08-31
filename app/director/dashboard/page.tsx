import {
  Activity,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  HeartPulse,
  Radio,
  Users
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getDirectorDashboard } from "@/server/director/queries";
import { getRecruitmentOverview } from "@/server/careers/queries";
import Link from "next/link";

export default async function DirectorDashboardPage() {
  const dashboard = await getDirectorDashboard();
  const careers = await getRecruitmentOverview();

  return (
    <div className="space-y-10">
      <DirectorPageHeader
        eyebrow="Director Command Center"
        title="Student transformation at a glance"
        description="Plan, monitor, and improve every active Skill City journey from one operational brain."
      />

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <DirectorMetricCard label="Active Programs" value={dashboard.stats.activePrograms} icon={GraduationCap} />
        <DirectorMetricCard label="Active Batches" value={dashboard.stats.activeBatches} icon={ClipboardCheck} />
        <DirectorMetricCard label="Students" value={dashboard.stats.students} icon={Users} />
        <DirectorMetricCard label="Today's Activities" value={dashboard.stats.todaysActivities} icon={Activity} />
        <DirectorMetricCard label="Upcoming Live Classes" value={dashboard.stats.upcomingLiveClasses} icon={Radio} />
        <DirectorMetricCard label="Pending Reviews" value={dashboard.stats.pendingReviews} icon={Bell} />
        <DirectorMetricCard label="Announcements Sent" value={dashboard.stats.announcementsSent} icon={CheckCircle2} />
        <DirectorMetricCard label="Student Completion %" value={`${dashboard.stats.studentCompletion}%`} icon={BarChart3} />
        <DirectorMetricCard label="Journey Health" value={`${dashboard.stats.journeyHealth}%`} icon={HeartPulse} />
        <DirectorMetricCard label="Attendance %" value={`${dashboard.stats.attendance}%`} icon={CalendarClock} />
        <DirectorMetricCard label="Career Applications" value={careers.stats.total} icon={BriefcaseBusiness} />
        <DirectorMetricCard label="Selected Candidates" value={careers.stats.selected} icon={BriefcaseBusiness} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-black text-brand-dark">Recent Director Activity</h2>
            <div className="mt-5 space-y-4">
              {dashboard.recentActivity.length === 0 ? (
                <p className="text-base font-semibold text-brand-muted">Director actions will appear here as planning begins.</p>
              ) : (
                dashboard.recentActivity.map((item) => (
                  <div key={item.id} className="rounded-lg bg-white p-4">
                    <p className="font-black text-brand-dark">{item.action.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-sm font-semibold text-brand-muted">{item.actor?.name ?? "System"} · {item.createdAt.toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-black text-brand-dark">Quick Actions</h2>
            <div className="mt-5 grid gap-3">
              <Button asChild size="lg"><Link href="/director/programs">Create Program</Link></Button>
              <Button asChild size="lg" variant="secondary"><Link href="/director/journey-planner">Plan a Day</Link></Button>
              <Button asChild size="lg" variant="secondary"><Link href="/director/communications">Send Announcement</Link></Button>
              <Button asChild size="lg" variant="secondary"><Link href="/director/careers">Recruitment Status</Link></Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
