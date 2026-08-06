import Link from "next/link";
import { BarChart3, CalendarClock, CheckCircle2, CreditCard, FileCheck2, TrendingUp, Users, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getAdmissionDashboard } from "@/server/admissions/queries";

export default async function AdmissionDashboardPage() {
  const dashboard = await getAdmissionDashboard();

  return (
    <div className="space-y-10">
      <DirectorPageHeader
        eyebrow="Admissions"
        title="Admissions operating system"
        description="Manage student acquisition from first inquiry to enrollment."
      />

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DirectorMetricCard label="Admissions Today" value={dashboard.stats.admissionsToday} icon={Users} />
        <DirectorMetricCard label="Conversion Rate" value={`${dashboard.stats.conversionRate}%`} icon={TrendingUp} />
        <DirectorMetricCard label="Revenue" value={`INR ${dashboard.stats.revenue}`} icon={CreditCard} />
        <DirectorMetricCard label="Pending Documents" value={dashboard.stats.pendingDocuments} icon={FileCheck2} />
        <DirectorMetricCard label="Pending Payments" value={dashboard.stats.pendingPayments} icon={CreditCard} />
        <DirectorMetricCard label="BDM Performance" value={dashboard.stats.bdmPerformance} icon={BarChart3} />
        <DirectorMetricCard label="Top Programs" value={dashboard.stats.topPrograms} icon={BarChart3} />
        <DirectorMetricCard label="Upcoming Counselling" value={dashboard.stats.upcomingCounselling} icon={CalendarClock} />
        <DirectorMetricCard label="Review Queue" value={dashboard.stats.pendingReview} icon={CheckCircle2} />
        <DirectorMetricCard label="Approved" value={dashboard.stats.approvedApplications} icon={CheckCircle2} />
        <DirectorMetricCard label="Rejected" value={dashboard.stats.rejectedApplications} icon={XCircle} />
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { href: "/admissions/review", label: "Review applications" },
          { href: "/admissions/approved", label: "Approved admissions" },
          { href: "/admissions/payments", label: "Fee follow-up" },
          { href: "/admissions/programs", label: "Manage programs" }
        ].map((action) => (
          <Link key={action.href} href={action.href} className="rounded-lg border border-black/8 bg-brand-card p-5 text-lg font-black text-brand-dark transition hover:-translate-y-1 hover:text-brand-red hover:shadow-soft">
            {action.label}
          </Link>
        ))}
      </section>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-black text-brand-dark">Upcoming Counselling</h2>
          <div className="mt-5 space-y-3">
            {dashboard.upcomingCounselling.length === 0 ? (
              <p className="font-semibold text-brand-muted">No upcoming sessions.</p>
            ) : (
              dashboard.upcomingCounselling.map((item) => (
                <div key={item.id} className="rounded-lg bg-white p-4">
                  <p className="font-black text-brand-dark">{item.lead.name}</p>
                  <p className="text-sm font-bold text-brand-muted">
                    {item.scheduledAt.toLocaleString()} - {item.counsellor?.name ?? "Unassigned"}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
