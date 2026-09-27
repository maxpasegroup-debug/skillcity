import { Users } from "lucide-react";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getExecutiveStudentOverview } from "@/server/executive/queries";

export default async function ExecutiveStudentsPage() {
  const { active, completed, atRisk } = await getExecutiveStudentOverview();
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Students" title="Student operating view" description="Student health, activity, risk and transformation outcomes." /><section className="grid gap-5 md:grid-cols-3"><DirectorMetricCard label="Active Students" value={active} icon={Users} /><DirectorMetricCard label="Completed" value={completed} icon={Users} /><DirectorMetricCard label="At Risk" value={atRisk} icon={Users} /></section></div>;
}
