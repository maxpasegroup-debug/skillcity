import Link from "next/link";
import { BookOpen, CalendarCheck, ClipboardCheck, CreditCard, FileText, GraduationCap, ListChecks, PhoneCall, TrendingUp, UserCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getAdminCommandCenter } from "@/server/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const data = await getAdminCommandCenter();

  const actionRequired = [
    { label: "Applications awaiting review", value: data.admissions.stats.pendingReview, href: "/admissions/review" },
    { label: "Payments awaiting verification", value: data.stats.paymentVerificationPending, href: "/admissions/action-queue" },
    { label: "Follow-ups due", value: data.stats.followUpsDue, href: "/telecaller?filter=follow-up" },
    { label: "Student activation pending", value: data.stats.approvedWithoutLogin, href: "/admissions/action-queue" },
    { label: "Unassigned leads", value: data.stats.unassignedLeads, href: "/telecaller?filter=new" },
    { label: "Batch assignment pending", value: data.stats.batchAssignmentPending, href: "/admissions/enrollments" }
  ];

  const pipeline = [
    { label: "Leads", value: data.admissions.stats.admissionsToday + data.stats.unassignedLeads },
    { label: "Telecaller", value: data.stats.todaysCalls },
    { label: "Counselling", value: data.stats.counsellingToday },
    { label: "Application", value: data.stats.totalApplications },
    { label: "Payment", value: data.stats.paymentsPending + data.stats.paymentVerificationPending },
    { label: "Admission", value: data.stats.admissionsConfirmed },
    { label: "Student", value: data.stats.activeStudents }
  ];

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Admin" title="AIRA Skill City Control Center" description="What is happening right now, what needs attention, and where to act next." />

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DirectorMetricCard label="New Leads" value={data.stats.newLeads} icon={Users} />
        <DirectorMetricCard label="Today's Calls" value={data.stats.todaysCalls} icon={PhoneCall} />
        <DirectorMetricCard label="Counselling Today" value={data.stats.counsellingToday} icon={CalendarCheck} />
        <DirectorMetricCard label="Applications" value={data.stats.totalApplications} icon={FileText} />
        <DirectorMetricCard label="Payments Pending" value={data.stats.paymentsPending} icon={CreditCard} />
        <DirectorMetricCard label="Payment Verification" value={data.stats.paymentVerificationPending} icon={ListChecks} />
        <DirectorMetricCard label="Admissions Confirmed" value={data.stats.admissionsConfirmed} icon={GraduationCap} />
        <DirectorMetricCard label="Active Students" value={data.stats.activeStudents} icon={UserCheck} />
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DirectorMetricCard label="Active Programs" value={data.academic.activePrograms} icon={BookOpen} />
        <DirectorMetricCard label="Active Batches" value={data.academic.activeBatches} icon={GraduationCap} />
        <DirectorMetricCard label="Trainers" value={data.academic.trainers} icon={Users} />
        <DirectorMetricCard label="Today's Classes" value={data.academic.todaysClasses} icon={CalendarCheck} />
        <DirectorMetricCard label="Attendance Today" value={data.academic.attendanceToday === null ? "Not started" : `${data.academic.attendanceToday}%`} icon={ClipboardCheck} />
        <DirectorMetricCard label="Pending Submissions" value={data.academic.pendingSubmissions} icon={FileText} />
        <DirectorMetricCard label="Academic Progress" value={`${data.academic.progress}%`} icon={TrendingUp} />
        <DirectorMetricCard label="Batch Pending" value={data.stats.batchAssignmentPending} icon={ListChecks} />
      </section>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-brand-red">Action Required</p>
              <h2 className="mt-2 text-3xl font-black text-brand-dark">Resolve the important work first</h2>
            </div>
            <Button asChild>
              <Link href="/admissions/action-queue">Open action queue</Link>
            </Button>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {actionRequired.map((item) => (
              <Link key={item.label} href={item.href} className="rounded-lg bg-white p-4 transition hover:-translate-y-1 hover:shadow-soft">
                <p className="text-3xl font-black text-brand-dark">{item.value}</p>
                <p className="mt-1 font-bold text-brand-muted">{item.label}</p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-black text-brand-dark">Admission Pipeline</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {pipeline.map((item) => (
                <div key={item.label} className="rounded-lg bg-white p-4">
                  <p className="text-sm font-black uppercase text-brand-red">{item.label}</p>
                  <p className="mt-2 text-3xl font-black text-brand-dark">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-black text-brand-dark">Core Modules</h2>
            <div className="mt-5 grid gap-3">
              {[
                { label: "Telecaller OS", href: "/telecaller" },
                { label: "Counsellor OS", href: "/counsellor" },
                { label: "Admission Queue", href: "/admissions/action-queue" },
                { label: "Batch Onboarding", href: "/admissions/enrollments" },
                { label: "Trainer Calendar", href: "/trainer/calendar" },
                { label: "Batch Management", href: "/director/batch-management" },
                { label: "Users & Roles", href: "/admin/users" },
                { label: "Security Settings", href: "/admin/settings" }
              ].map((item) => (
                <Link key={item.href} href={item.href} className="rounded-lg bg-white p-4 font-black text-brand-dark hover:text-brand-red">
                  {item.label}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-black text-brand-dark">Program Overview</h2>
            <div className="mt-5 space-y-3">
              {data.programOverview.map((program) => (
                <div key={program.id} className="rounded-lg bg-white p-4">
                  <p className="font-black text-brand-dark">{program.name}</p>
                  <p className="mt-1 text-sm font-bold text-brand-muted">
                    {program._count.leads} leads - {program._count.admissionApplications} applications - {program._count.enrollments} active students
                  </p>
                </div>
              ))}
              {data.programOverview.length === 0 ? <p className="font-semibold text-brand-muted">No public programs configured.</p> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-black text-brand-dark">Recent Admin Activity</h2>
            <div className="mt-5 space-y-3">
              {data.auditLogs.map((log) => (
                <div key={log.id} className="rounded-lg bg-white p-4">
                  <p className="font-black text-brand-dark">{log.action.replaceAll("_", " ")}</p>
                  <p className="mt-1 text-sm font-bold text-brand-muted">{log.user?.name ?? "System"} - {log.createdAt.toLocaleString()}</p>
                </div>
              ))}
              {data.auditLogs.length === 0 ? <p className="font-semibold text-brand-muted">No audit activity yet.</p> : null}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-black text-brand-dark">Recent WhatsApp Login Messages</h2>
          <div className="mt-6 space-y-3">
            {data.whatsappMessages.length === 0 ? (
              <p className="font-semibold text-brand-muted">No WhatsApp login messages yet.</p>
            ) : (
              data.whatsappMessages.map((message) => (
                <div key={message.id} className="rounded-lg bg-white p-4">
                  <p className="font-black text-brand-dark">{message.application?.lead.name ?? message.user?.name ?? message.to}</p>
                  <p className="mt-1 text-sm font-bold text-brand-muted">{message.template} - {message.status} - {message.provider ?? "Provider"}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
