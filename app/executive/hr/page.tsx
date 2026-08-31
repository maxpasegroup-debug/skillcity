import { Card, CardContent } from "@/components/ui/card";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { EmployeeForm } from "@/features/executive/components/executive-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getRecruitmentOverview } from "@/server/careers/queries";
import { getRMPerformanceManagement } from "@/server/careers/rm-performance";
import { getExecutiveData } from "@/server/executive/queries";
import { BriefcaseBusiness, CalendarClock, CheckCircle2, FileText, UserCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function HRPage() {
  const [institutions, campuses, departments, employees, , , , users] = await getExecutiveData();
  const [recruitment, rmPerformance] = await Promise.all([getRecruitmentOverview(), getRMPerformanceManagement()]);
  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="HR" title="People operations" description="Employees, roles, departments, recruitment, performance, leave and payroll architecture." />
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DirectorMetricCard label="Career Applications" value={recruitment.stats.total} icon={FileText} />
        <DirectorMetricCard label="New Applications" value={recruitment.stats.newApplications} icon={BriefcaseBusiness} />
        <DirectorMetricCard label="Interview Pending" value={recruitment.stats.interviewPending} icon={CalendarClock} />
        <DirectorMetricCard label="Selected" value={recruitment.stats.selected} icon={CheckCircle2} />
      </section>
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-brand-red">Recruitment Pipeline</p>
            <h2 className="mt-2 text-2xl font-black text-brand-dark">HR career applications</h2>
            <p className="mt-2 font-semibold leading-7 text-brand-muted">Career recruitment is managed separately from admissions and can be reviewed in the HR pipeline.</p>
          </div>
          <Button asChild>
            <Link href="/admin/careers">
              Open Recruitment
              <UserCheck className="h-5 w-5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-black text-brand-dark">Relationship Manager Performance</h2>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {rmPerformance.slice(0, 8).map((item) => (
              <div key={item.development.id} className="rounded-lg bg-white p-4">
                <p className="font-black text-brand-dark">{item.development.employee?.user.name ?? item.development.application.candidateName}</p>
                <p className="mt-1 text-sm font-bold text-brand-muted">{item.development.application.district} - {item.performance.performanceStatus.replaceAll("_", " ")}</p>
                <p className="mt-1 text-sm font-bold text-brand-muted">{item.performance.actual}/{item.performance.target} admissions - {item.performance.achievementPercent}%</p>
              </div>
            ))}
            {rmPerformance.length === 0 ? <p className="font-semibold text-brand-muted">No RM development records yet.</p> : null}
          </div>
        </CardContent>
      </Card>
      <Card><CardContent className="p-6"><EmployeeForm users={users} institutions={institutions} campuses={campuses} departments={departments} /></CardContent></Card>
      <div className="grid gap-5 lg:grid-cols-2">{employees.map((employee) => <Card key={employee.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{employee.status} - {employee.employmentType}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{employee.user.name}</h2><p className="mt-2 font-bold text-brand-muted">{employee.title ?? "Team member"} - {employee.department?.name ?? "No department"}</p></CardContent></Card>)}</div>
    </div>
  );
}
