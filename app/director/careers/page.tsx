import Link from "next/link";
import { BriefcaseBusiness, CalendarClock, CheckCircle2, FileText, MapPin, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getRecruitmentOverview, requireDirectorRecruitmentView } from "@/server/careers/queries";
import { getRMPerformanceManagement, type RMPerformanceStatus } from "@/server/careers/rm-performance";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ district?: string; status?: string; performance?: string }> };

const performanceOptions: RMPerformanceStatus[] = ["NOT_STARTED", "ON_TRACK", "NEEDS_ATTENTION", "AT_RISK", "TARGET_ACHIEVED", "PERIOD_ENDED"];

export default async function DirectorCareersPage({ searchParams }: Props) {
  await requireDirectorRecruitmentView();
  const params = await searchParams;
  const performance = performanceOptions.includes(params.performance as RMPerformanceStatus) ? params.performance as RMPerformanceStatus : undefined;
  const data = await getRecruitmentOverview();
  const rmPerformance = await getRMPerformanceManagement({ district: params.district, status: params.status, performance });

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Director / Careers" title="Recruitment Status" description="Career applications, department demand, interview movement and Relationship Manager development candidates." />
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DirectorMetricCard label="Career Applications" value={data.stats.total} icon={FileText} />
        <DirectorMetricCard label="New Applications" value={data.stats.newApplications} icon={BriefcaseBusiness} />
        <DirectorMetricCard label="Interview Pipeline" value={data.stats.interviewPending} icon={CalendarClock} />
        <DirectorMetricCard label="Selected Candidates" value={data.stats.selected} icon={CheckCircle2} />
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <Summary title="Applications by Department" items={data.byCategory.map((item) => ({ label: item.categoryTitle, value: item._count }))} />
        <Summary title="Applications by District" items={data.byDistrict.map((item) => ({ label: item.district, value: item._count }))} />
        <Summary title="Applications by Role" items={data.byRole.map((item) => ({ label: item.roleTitle, value: item._count }))} />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-black text-brand-dark">Recent Career Applications</h2>
            <div className="mt-5 space-y-3">
              {data.applications.slice(0, 10).map((application) => (
                <div key={application.id} className="rounded-lg bg-white p-4">
                  <p className="font-black text-brand-dark">{application.candidateName}</p>
                  <p className="mt-1 text-sm font-bold text-brand-muted">{application.roleTitle} - {application.district} - {application.stage.replaceAll("_", " ")}</p>
                </div>
              ))}
              {data.applications.length === 0 ? <p className="font-semibold text-brand-muted">No career applications yet.</p> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-black text-brand-dark">Relationship Manager Development</h2>
                <p className="mt-2 font-semibold text-brand-muted">Derived from approved CRM admissions and active enrollments.</p>
              </div>
            </div>
            <form className="mt-5 grid gap-3 md:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-brand-dark">District</span>
                <input name="district" defaultValue={params.district ?? ""} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 text-brand-dark" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-brand-dark">Development Status</span>
                <select name="status" defaultValue={params.status ?? ""} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold text-brand-dark">
                  <option value="">All</option>
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Development</option>
                  <option value="EVALUATION_PENDING">Under Review</option>
                  <option value="ELIGIBLE">Eligible</option>
                  <option value="NOT_ELIGIBLE">Not Eligible</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-brand-dark">Performance</span>
                <select name="performance" defaultValue={performance ?? ""} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold text-brand-dark">
                  <option value="">All</option>
                  {performanceOptions.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
                </select>
              </label>
              <div className="md:col-span-3">
                <Button>Filter RM Performance</Button>
              </div>
            </form>
            <div className="mt-5 space-y-3">
              {rmPerformance.map((item) => (
                <div key={item.development.id} className="rounded-lg bg-white p-4">
                  <p className="font-black text-brand-dark">{item.development.employee?.user.name ?? item.development.application.candidateName}</p>
                  <p className="mt-1 text-sm font-bold text-brand-muted">{item.development.application.district} - {item.performance.performanceStatus.replaceAll("_", " ")}</p>
                  <p className="mt-1 text-sm font-bold text-brand-muted">{item.performance.actual}/{item.performance.target} admissions - {item.performance.remaining} remaining - {item.performance.achievementPercent}%</p>
                  <p className="mt-1 text-sm font-bold text-brand-muted">Days remaining {item.performance.daysRemaining ?? "Pending"}</p>
                </div>
              ))}
              {rmPerformance.length === 0 ? <p className="font-semibold text-brand-muted">No RM development records yet.</p> : null}
            </div>
          </CardContent>
        </Card>
      </section>

      <Button asChild variant="secondary">
        <Link href="/admin/careers">
          Open HR Recruitment
          <UserCheck className="h-5 w-5" />
        </Link>
      </Button>
    </div>
  );
}

function Summary({ title, items }: { title: string; items: Array<{ label: string; value: number }> }) {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-black text-brand-dark">{title}</h2>
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-lg bg-white p-4">
              <p className="flex items-center gap-2 font-bold text-brand-muted"><MapPin className="h-4 w-4 text-brand-red" />{item.label}</p>
              <p className="text-xl font-black text-brand-dark">{item.value}</p>
            </div>
          ))}
          {items.length === 0 ? <p className="font-semibold text-brand-muted">No data yet.</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
