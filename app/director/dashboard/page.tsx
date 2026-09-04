import {
  Activity,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  HeartPulse,
  Layers3,
  Radio,
  UserRoundCheck,
  Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getDirectorDashboard } from "@/server/director/queries";
import { getRecruitmentOverview } from "@/server/careers/queries";
import { getAdmissionDashboard } from "@/server/admissions/queries";
import Link from "next/link";

export default async function DirectorDashboardPage() {
  const dashboard = await getDirectorDashboard();
  const [careers, admissions] = await Promise.all([getRecruitmentOverview(), getAdmissionDashboard()]);
  const commandModules = [
    {
      title: "HR",
      description: "Interview applications, Academic Advisor candidates, hiring stages and office interview forms.",
      href: "/admin/careers?role=academic-advisor",
      icon: UserRoundCheck,
      primaryMetric: careers.stats.academicAdvisorNew,
      primaryLabel: "advisor active",
      secondaryMetric: careers.stats.interviewPending,
      secondaryLabel: "interview pending",
      action: "Open HR"
    },
    {
      title: "Admission Cell",
      description: "Move applicants from enquiry to counselling, approval, admission, customer care and admin work.",
      href: "/admissions/dashboard",
      icon: BriefcaseBusiness,
      primaryMetric: admissions.stats.pendingReview,
      primaryLabel: "review pending",
      secondaryMetric: admissions.stats.upcomingCounselling,
      secondaryLabel: "counselling queued",
      action: "Open Cell"
    },
    {
      title: "Applications",
      description: "Review Startup Skool and AIRA Labs applications with current admission status.",
      href: "/admissions/applications",
      icon: FileText,
      primaryMetric: admissions.stats.startupSkoolApplications,
      primaryLabel: "startup skool",
      secondaryMetric: admissions.stats.airaLabsApplications,
      secondaryLabel: "aira labs",
      action: "View Applications"
    },
    {
      title: "Interviews",
      description: "Track scheduled interviews, pending decisions, selected candidates and hold cases.",
      href: "/admin/careers",
      icon: CalendarClock,
      primaryMetric: careers.stats.interviewPending,
      primaryLabel: "pending",
      secondaryMetric: careers.stats.selected,
      secondaryLabel: "selected",
      action: "Open Interviews"
    },
    {
      title: "Batch Allocation",
      description: "Assign admitted learners to batches and monitor active program capacity.",
      href: "/director/batch-management",
      icon: Layers3,
      primaryMetric: dashboard.stats.activeBatches,
      primaryLabel: "active batches",
      secondaryMetric: dashboard.stats.students,
      secondaryLabel: "students",
      action: "Manage Batches"
    },
    {
      title: "Reports",
      description: "Review admissions, recruitment, student progress, attendance and operating health.",
      href: "/director/analytics",
      icon: BarChart3,
      primaryMetric: `${dashboard.stats.journeyHealth}%`,
      primaryLabel: "journey health",
      secondaryMetric: `${admissions.stats.conversionRate}%`,
      secondaryLabel: "conversion",
      action: "Open Reports"
    }
  ] satisfies CommandModule[];

  return (
    <div className="space-y-10">
      <DirectorPageHeader
        eyebrow="Director Command Center"
        title="Student transformation at a glance"
        description="Plan, monitor, and improve every active Skill City journey from one operational brain."
      />

      <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {commandModules.map((module) => (
          <CommandModuleCard key={module.title} module={module} />
        ))}
      </section>

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

type CommandModule = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  primaryMetric: string | number;
  primaryLabel: string;
  secondaryMetric: string | number;
  secondaryLabel: string;
  action: string;
};

function CommandModuleCard({ module }: { module: CommandModule }) {
  const Icon = module.icon;
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex min-h-72 flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-lg bg-brand-dark text-brand-gold">
            <Icon className="h-7 w-7" />
          </div>
          <span className="rounded-full bg-brand-beige px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-brand-red">Module</span>
        </div>
        <h2 className="mt-7 text-3xl font-black text-brand-dark">{module.title}</h2>
        <p className="mt-3 flex-1 font-semibold leading-7 text-brand-muted">{module.description}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-white p-4">
            <p className="text-2xl font-black text-brand-dark">{module.primaryMetric}</p>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-brand-muted">{module.primaryLabel}</p>
          </div>
          <div className="rounded-lg bg-white p-4">
            <p className="text-2xl font-black text-brand-dark">{module.secondaryMetric}</p>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-brand-muted">{module.secondaryLabel}</p>
          </div>
        </div>
        <Button asChild className="mt-5 w-full rounded-full">
          <Link href={module.href}>{module.action}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
