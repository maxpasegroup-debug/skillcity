import { Building2 } from "lucide-react";
import { AnalyticsMetricCard } from "@/features/analytics/components/analytics-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getExecutiveIntelligence } from "@/server/analytics/queries";

export default async function InstitutionHealthPage() {
  const data = await getExecutiveIntelligence("THIS_MONTH");
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Organization" title="Authorized operating footprint" description="Current organization records visible through the executive user's effective scope." /><section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5"><AnalyticsMetricCard label="Organizations" value={data.organization.institutions} icon={Building2} /><AnalyticsMetricCard label="Divisions" value={data.organization.divisions} icon={Building2} /><AnalyticsMetricCard label="Districts" value={data.organization.districts} icon={Building2} /><AnalyticsMetricCard label="Branches" value={data.organization.campuses} icon={Building2} /><AnalyticsMetricCard label="Departments" value={data.organization.departments} icon={Building2} /></section><p className="font-semibold text-brand-muted">No synthetic health score is calculated. Operational attention is shown only when supported by authoritative records.</p></div>;
}
