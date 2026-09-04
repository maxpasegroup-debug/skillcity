import Link from "next/link";
import { BarChart3, CalendarClock, CheckCircle2, CreditCard, FileCheck2, GraduationCap, ListChecks, TrendingUp, UserCheck, Users, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getAdmissionDashboard } from "@/server/admissions/queries";
import { getAdmissionPhase4Queue } from "@/server/admissions/phase4-queries";

export default async function AdmissionDashboardPage() {
  const [dashboard, queue] = await Promise.all([getAdmissionDashboard(), getAdmissionPhase4Queue()]);

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
        <DirectorMetricCard label="Startup Skool Apps" value={dashboard.stats.startupSkoolApplications} icon={GraduationCap} />
        <DirectorMetricCard label="AIRA Labs Apps" value={dashboard.stats.airaLabsApplications} icon={GraduationCap} />
        <DirectorMetricCard label="Payment Verification" value={queue.stats.paymentVerification} icon={CreditCard} />
        <DirectorMetricCard label="Activation Pending" value={queue.stats.studentActivationPending} icon={UserCheck} />
        <DirectorMetricCard label="Batch Pending" value={queue.stats.batchAssignmentPending} icon={GraduationCap} />
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { href: "/admissions/action-queue", label: "Action required" },
          { href: "/admissions/review", label: "Review applications" },
          { href: "/admissions/applications?program=startup-skool", label: "Startup Skool apps" },
          { href: "/admissions/applications?program=aira-labs", label: "AIRA Labs apps" },
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
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-brand-beige text-brand-red">
              <ListChecks className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-brand-dark">Action Required</h2>
              <p className="mt-2 font-semibold text-brand-muted">
                {queue.stats.pendingReview} review, {queue.stats.paymentPending} payment pending, {queue.stats.paymentVerification} verification, {queue.stats.studentActivationPending} activation.
              </p>
              <Link href="/admissions/action-queue" className="mt-4 inline-block font-black text-brand-red">Open action queue</Link>
            </div>
          </div>
        </CardContent>
      </Card>

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
