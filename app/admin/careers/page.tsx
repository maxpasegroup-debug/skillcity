import Link from "next/link";
import type { CareerRecruitmentStage } from "@prisma/client";
import { BriefcaseBusiness, CalendarClock, CheckCircle2, Clock, FileText, Search, UserCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { CareerInterviewForm, CareerInterviewResultForm, CareerNoteForm, CareerStageForm, RMDevelopmentStartForm, RMEvaluationForm, RMTargetForm } from "@/features/careers/components/recruitment-forms";
import { careerCategories, careerRoles } from "@/features/careers/catalog";
import { recruitmentStages } from "@/features/careers/stages";
import { getRMEmployeeOptions, getRecruitmentOverview, getRecruitmentUsers, requireRecruitmentUser } from "@/server/careers/queries";
import { getRMPerformanceManagement, type RMPerformanceStatus } from "@/server/careers/rm-performance";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ role?: string; category?: string; district?: string; stage?: string; q?: string; rmStatus?: string; performance?: string }>;
};

const performanceOptions: RMPerformanceStatus[] = ["NOT_STARTED", "ON_TRACK", "NEEDS_ATTENTION", "AT_RISK", "TARGET_ACHIEVED", "PERIOD_ENDED"];

export default async function AdminCareersPage({ searchParams }: Props) {
  await requireRecruitmentUser();
  const params = await searchParams;
  const stage = recruitmentStages.includes(params.stage as CareerRecruitmentStage) ? params.stage as CareerRecruitmentStage : undefined;
  const performance = performanceOptions.includes(params.performance as RMPerformanceStatus) ? params.performance as RMPerformanceStatus : undefined;
  const data = await getRecruitmentOverview({ role: params.role, category: params.category, district: params.district, stage, q: params.q });
  const [users, rmEmployees, rmPerformance] = await Promise.all([getRecruitmentUsers(), getRMEmployeeOptions(), getRMPerformanceManagement({ district: params.district, status: params.rmStatus, performance })]);

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="HR / Careers" title="Careers & Recruitment" description="Dedicated HR pipeline for AIRA Skill City career applications, separate from student admissions." />

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DirectorMetricCard label="Total Career Applications" value={data.stats.total} icon={FileText} />
        <DirectorMetricCard label="New Applications" value={data.stats.newApplications} icon={Clock} />
        <DirectorMetricCard label="Screening Pending" value={data.stats.screeningPending} icon={Search} />
        <DirectorMetricCard label="Interview Pending" value={data.stats.interviewPending} icon={CalendarClock} />
        <DirectorMetricCard label="Selected" value={data.stats.selected} icon={CheckCircle2} />
        <DirectorMetricCard label="Rejected" value={data.stats.rejected} icon={XCircle} />
        <DirectorMetricCard label="On Hold" value={data.stats.onHold} icon={BriefcaseBusiness} />
        <DirectorMetricCard label="Active Employees" value={data.stats.activeEmployees} icon={UserCheck} />
      </section>

      <Card>
        <CardContent className="p-6">
          <form className="grid gap-4 md:grid-cols-5">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-brand-dark">Search</span>
              <input name="q" defaultValue={params.q ?? ""} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 text-brand-dark" />
            </label>
            <Select name="category" label="Category" defaultValue={params.category ?? ""}>
              <option value="">All categories</option>
              {careerCategories.map((category) => <option key={category.slug} value={category.slug}>{category.title}</option>)}
            </Select>
            <Select name="role" label="Role" defaultValue={params.role ?? ""}>
              <option value="">All roles</option>
              {careerRoles.map((role) => <option key={role.slug} value={role.slug}>{role.title}</option>)}
            </Select>
            <Select name="stage" label="Stage" defaultValue={stage ?? ""}>
              <option value="">All stages</option>
              {recruitmentStages.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
            </Select>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-brand-dark">District</span>
              <input name="district" defaultValue={params.district ?? ""} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 text-brand-dark" />
            </label>
            <div className="md:col-span-5">
              <Button>Filter Candidates</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-5 lg:grid-cols-3">
        <SummaryCard title="Applications by Role" items={data.byRole.map((item) => ({ label: item.roleTitle, value: item._count }))} />
        <SummaryCard title="Applications by District" items={data.byDistrict.map((item) => ({ label: item.district, value: item._count }))} />
        <SummaryCard title="Applications by Department" items={data.byCategory.map((item) => ({ label: item.categoryTitle, value: item._count }))} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {data.applications.map((application) => (
            <Card key={application.id}>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase text-brand-red">{application.stage.replaceAll("_", " ")}</p>
                    <h2 className="mt-2 text-2xl font-black text-brand-dark">{application.candidateName}</h2>
                    <p className="mt-2 font-bold text-brand-muted">{application.roleTitle} - {application.categoryTitle} - {application.district}</p>
                    <p className="mt-3 max-w-3xl leading-7 text-brand-muted">{application.shortIntro}</p>
                    <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold text-brand-muted">
                      <span>{application.mobile}</span>
                      <span>{application.email}</span>
                      <span>{application.availability}</span>
                      {application.resumeUrl ? <a className="text-brand-red underline" href={application.resumeUrl} target="_blank" rel="noreferrer">Resume</a> : null}
                      {application.profileUrl ? <a className="text-brand-red underline" href={application.profileUrl} target="_blank" rel="noreferrer">Profile</a> : null}
                    </div>
                  </div>
                  <div className="grid gap-3 lg:w-72">
                    <CareerStageForm applicationId={application.id} currentStage={application.stage} />
                  </div>
                </div>
                <div className="mt-6 grid gap-5 lg:grid-cols-3">
                  <CareerNoteForm applicationId={application.id} />
                  <CareerInterviewForm applicationId={application.id} users={users} />
                  <CareerInterviewResultForm interviews={application.interviews} />
                </div>
                {application.rmDevelopment ? (
                  <div className="mt-6 grid gap-5 lg:grid-cols-3">
                    <div className="rounded-lg bg-brand-beige/60 p-5">
                        <h3 className="text-xl font-black text-brand-dark">RM Development</h3>
                        <p className="mt-2 text-sm font-bold text-brand-muted">{application.rmDevelopment.status.replaceAll("_", " ")} - Target {application.rmDevelopment.targetAdmissions}</p>
                        <div className="mt-4">
                          <RMDevelopmentStartForm developmentId={application.rmDevelopment.id} employees={rmEmployees} defaultTarget={application.rmDevelopment.targetAdmissions} />
                        </div>
                    </div>
                    <div className="rounded-lg bg-brand-beige/60 p-5">
                        <h3 className="text-xl font-black text-brand-dark">Target Control</h3>
                        <div className="mt-4">
                          <RMTargetForm developmentId={application.rmDevelopment.id} defaultTarget={application.rmDevelopment.targetAdmissions} />
                        </div>
                    </div>
                    <div className="rounded-lg bg-brand-beige/60 p-5">
                        <h3 className="text-xl font-black text-brand-dark">Final Evaluation</h3>
                        <div className="mt-4">
                          <RMEvaluationForm developmentId={application.rmDevelopment.id} />
                        </div>
                    </div>
                  </div>
                ) : null}
                <div className="mt-6 rounded-lg bg-white p-4">
                  <p className="text-sm font-black uppercase text-brand-red">Activity History</p>
                  <div className="mt-3 space-y-2">
                    {application.activities.map((activity) => (
                      <p key={activity.id} className="text-sm font-semibold text-brand-muted">{activity.action.replaceAll("_", " ")} - {activity.actor?.name ?? "System"} - {activity.createdAt.toLocaleString()}</p>
                    ))}
                    {application.activities.length === 0 ? <p className="text-sm font-semibold text-brand-muted">No activity yet.</p> : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {data.applications.length === 0 ? <Card><CardContent className="p-6"><p className="font-semibold text-brand-muted">No career applications match these filters.</p></CardContent></Card> : null}
        </div>

        <aside className="space-y-5">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-black text-brand-dark">Interview Pipeline</h2>
              <div className="mt-5 space-y-3">
                {data.interviewPipeline.map((interview) => (
                  <div key={interview.id} className="rounded-lg bg-white p-4">
                    <p className="font-black text-brand-dark">{interview.application.candidateName}</p>
                    <p className="mt-1 text-sm font-bold text-brand-muted">{interview.application.roleTitle} - {interview.scheduledAt.toLocaleString()}</p>
                    <p className="mt-1 text-sm font-bold text-brand-muted">{interview.interviewer?.name ?? "Interviewer pending"}</p>
                  </div>
                ))}
                {data.interviewPipeline.length === 0 ? <p className="font-semibold text-brand-muted">No scheduled interviews.</p> : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-black text-brand-dark">Relationship Manager Development</h2>
              <form className="mt-5 grid gap-3">
                <input type="hidden" name="role" value={params.role ?? ""} />
                <input type="hidden" name="category" value={params.category ?? ""} />
                <input type="hidden" name="district" value={params.district ?? ""} />
                <Select name="rmStatus" label="Development Status" defaultValue={params.rmStatus ?? ""}>
                  <option value="">All</option>
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Development</option>
                  <option value="EVALUATION_PENDING">Under Review</option>
                  <option value="ELIGIBLE">Eligible</option>
                  <option value="NOT_ELIGIBLE">Not Eligible</option>
                  <option value="COMPLETED">Completed</option>
                </Select>
                <Select name="performance" label="Performance" defaultValue={performance ?? ""}>
                  <option value="">All</option>
                  {performanceOptions.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
                </Select>
                <Button variant="secondary">Filter RM</Button>
              </form>
              <div className="mt-5 space-y-3">
                {rmPerformance.map((item) => {
                  return (
                    <div key={item.development.id} className="rounded-lg bg-white p-4">
                      <p className="font-black text-brand-dark">{item.development.employee?.user.name ?? item.development.application.candidateName}</p>
                      <p className="mt-1 text-sm font-bold text-brand-muted">{item.performance.performanceStatus.replaceAll("_", " ")} - Target {item.performance.target}</p>
                      <p className="mt-1 text-sm font-bold text-brand-muted">Admissions {item.performance.actual} - Remaining {item.performance.remaining}</p>
                      <p className="mt-1 text-sm font-bold text-brand-muted">Days remaining {item.performance.daysRemaining ?? "Pending"}</p>
                    </div>
                  );
                })}
                {rmPerformance.length === 0 ? <p className="font-semibold text-brand-muted">No RM development candidates yet.</p> : null}
              </div>
            </CardContent>
          </Card>

          <Button asChild variant="secondary" className="w-full">
            <Link href="/careers">Open public careers page</Link>
          </Button>
        </aside>
      </section>
    </div>
  );
}

function Select({ name, label, children, defaultValue }: { name: string; label: string; children: React.ReactNode; defaultValue?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span>
      <select name={name} defaultValue={defaultValue} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold text-brand-dark">
        {children}
      </select>
    </label>
  );
}

function SummaryCard({ title, items }: { title: string; items: Array<{ label: string; value: number }> }) {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-black text-brand-dark">{title}</h2>
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-lg bg-white p-4">
              <p className="font-bold text-brand-muted">{item.label}</p>
              <p className="text-xl font-black text-brand-dark">{item.value}</p>
            </div>
          ))}
          {items.length === 0 ? <p className="font-semibold text-brand-muted">No data yet.</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
