import { AlertTriangle, CheckCircle2, Clock, Target, TrendingUp, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getRMPerformanceForUser } from "@/server/careers/rm-performance";
import { requireRelationshipManagerUser } from "@/server/careers/queries";

export default async function RelationshipManagerDashboardPage() {
  const user = await requireRelationshipManagerUser();
  const data = await getRMPerformanceForUser(user.id);

  if (!data) {
    return (
      <div className="space-y-10">
        <DirectorPageHeader eyebrow="Relationship Manager" title={`Welcome, ${user.name}`} description="Your 3-month development program will appear here once HR links your employee profile." />
        <Card><CardContent className="p-6"><p className="font-semibold leading-7 text-brand-muted">No active Relationship Manager development record is linked to this account yet.</p></CardContent></Card>
      </div>
    );
  }

  const { development, attributedAdmissions, performance } = data;
  const progressStyle = { width: `${performance.achievementPercent}%` };

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Relationship Manager" title={`Welcome, ${user.name}`} description="Your 3-month development target, real admissions achievement and remaining work." />

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DirectorMetricCard label="Target" value={performance.target} icon={Target} />
        <DirectorMetricCard label="Achieved" value={performance.actual} icon={CheckCircle2} />
        <DirectorMetricCard label="Remaining" value={performance.remaining} icon={Users} />
        <DirectorMetricCard label="Achievement" value={`${performance.achievementPercent}%`} icon={TrendingUp} />
      </section>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-brand-red">Performance Status</p>
              <h2 className="mt-2 text-3xl font-black text-brand-dark">{performance.performanceStatus.replaceAll("_", " ")}</h2>
              <p className="mt-2 font-semibold leading-7 text-brand-muted">
                {development.developmentStart && development.developmentEnd ? `${development.developmentStart.toLocaleDateString()} to ${development.developmentEnd.toLocaleDateString()}` : "Development dates pending"}
              </p>
            </div>
            <div className="grid gap-2 text-sm font-bold text-brand-muted sm:grid-cols-2 lg:text-right">
              <p>Days elapsed: {performance.daysElapsed ?? "Pending"}</p>
              <p>Days remaining: {performance.daysRemaining ?? "Pending"}</p>
              <p>Required/day: {performance.requiredAveragePerDay ?? "Pending"}</p>
              <p>Required/week: {performance.requiredAveragePerWeek ?? "Pending"}</p>
            </div>
          </div>
          <div className="mt-6 h-4 overflow-hidden rounded-full bg-brand-beige">
            <div className="h-full rounded-full bg-brand-red transition-all" style={progressStyle} />
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-5 lg:grid-cols-3">
        <Checkpoint title="30 Days" target={performance.checkpoints.day30.targetProgress} actual={performance.checkpoints.day30.actualAdmissions} status={performance.checkpoints.day30.status} />
        <Checkpoint title="60 Days" target={performance.checkpoints.day60.targetProgress} actual={performance.checkpoints.day60.actualAdmissions} status={performance.checkpoints.day60.status} />
        <Checkpoint title="90 Days" target={performance.checkpoints.day90.targetProgress} actual={performance.checkpoints.day90.actualAdmissions} status={performance.checkpoints.day90.status} />
      </section>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-black text-brand-dark">Attributed Admissions</h2>
          <div className="mt-5 space-y-3">
            {attributedAdmissions.map((admission) => (
              <div key={admission.applicationId} className="grid gap-2 rounded-lg bg-white p-4 md:grid-cols-[1fr_1fr_150px_180px] md:items-center">
                <p className="font-black text-brand-dark">{admission.candidate}</p>
                <p className="font-bold text-brand-muted">{admission.program}</p>
                <p className="font-bold text-brand-muted">{admission.admissionStatus}</p>
                <p className="font-bold text-brand-muted">{admission.admissionDate?.toLocaleDateString() ?? admission.currentStage}</p>
              </div>
            ))}
            {attributedAdmissions.length === 0 ? <p className="font-semibold text-brand-muted">No confirmed attributed admissions in this development period yet.</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Checkpoint({ title, target, actual, status }: { title: string; target: number; actual: number; status: string }) {
  const Icon = status === "ON TRACK" ? CheckCircle2 : AlertTriangle;
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 text-brand-red"><Icon className="h-5 w-5" /><p className="text-sm font-black uppercase">{title}</p></div>
        <p className="mt-5 text-3xl font-black text-brand-dark">{actual}/{target}</p>
        <p className="mt-2 flex items-center gap-2 font-bold text-brand-muted"><Clock className="h-4 w-4" />{status}</p>
      </CardContent>
    </Card>
  );
}
