import Link from "next/link";
import { BarChart3, Bot, BriefcaseBusiness, CreditCard, HeartPulse, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getExecutiveDashboard } from "@/server/executive/queries";

export default async function ExecutiveDashboardPage() {
  const dashboard = await getExecutiveDashboard();
  const actions = [
    { title: "Review admissions", href: "/executive/admissions", detail: `${dashboard.stats.admissionsToday} new today` },
    { title: "Check finance", href: "/executive/finance", detail: `INR ${dashboard.stats.revenueToday} today` },
    { title: "Open automation", href: "/executive/automation-center", detail: `${dashboard.stats.pendingExecutiveActions} pending` },
    { title: "Ask Tara", href: "/executive/ai-command-center", detail: "Executive AI assistant" }
  ];

  return (
    <div className="space-y-10">
      <section className="rounded-lg bg-brand-card p-6 md:p-8">
        <DirectorPageHeader eyebrow="Founder Command Center" title="Run Skill City with clarity." description="Admissions, revenue, students, teams, community, marketplace and AI signals in one executive view." />
        <div className="mt-6 flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg"><Link href="/executive/ai-command-center">Ask Tara</Link></Button>
          <Button asChild size="lg" variant="secondary"><Link href="/executive/reports">Generate Report</Link></Button>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DirectorMetricCard label="Today's Admissions" value={dashboard.stats.admissionsToday} icon={BriefcaseBusiness} />
        <DirectorMetricCard label="Today's Revenue" value={`INR ${dashboard.stats.revenueToday}`} icon={CreditCard} />
        <DirectorMetricCard label="Active Students" value={dashboard.stats.activeStudents} icon={Users} />
        <DirectorMetricCard label="Retention Rate" value={`${dashboard.stats.retentionRate}%`} icon={TrendingUp} />
        <DirectorMetricCard label="Completion Rate" value={`${dashboard.stats.completionRate}%`} icon={BarChart3} />
        <DirectorMetricCard label="Attendance" value={`${dashboard.stats.attendance}%`} icon={HeartPulse} />
        <DirectorMetricCard label="Trainer Performance" value={dashboard.stats.trainerPerformance} icon={Users} />
        <DirectorMetricCard label="BDM Performance" value={dashboard.stats.bdmPerformance} icon={BriefcaseBusiness} />
        <DirectorMetricCard label="Community Engagement" value={dashboard.stats.communityEngagement} icon={Users} />
        <DirectorMetricCard label="Marketplace Revenue" value={`${dashboard.stats.marketplaceRevenue} coins`} icon={ShoppingBag} />
        <DirectorMetricCard label="AI Usage" value={dashboard.stats.aiUsage} icon={Bot} />
        <DirectorMetricCard label="System Health" value={`${dashboard.stats.systemHealth}%`} icon={HeartPulse} />
      </section>

      <section className="grid gap-5 lg:grid-cols-4">
        {actions.map((action) => (
          <Card key={action.title}>
            <CardContent className="flex min-h-44 flex-col p-6">
              <h2 className="text-2xl font-black text-brand-dark">{action.title}</h2>
              <p className="mt-3 flex-1 font-bold text-brand-muted">{action.detail}</p>
              <Button asChild className="mt-5 w-full" variant="secondary"><Link href={action.href}>Open</Link></Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
