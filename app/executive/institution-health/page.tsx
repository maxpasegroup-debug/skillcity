import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getExecutiveDashboard, getExecutiveData } from "@/server/executive/queries";

export default async function InstitutionHealthPage() {
  const [dashboard, [institutions, campuses, departments]] = await Promise.all([getExecutiveDashboard(), getExecutiveData()]);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Institution Health" title="Operating health" description="Institution, campus, program, student, team, community and AI health in one scan." /><section className="grid gap-5 md:grid-cols-3"><Card><CardContent className="p-6"><p className="font-bold text-brand-muted">Institutions</p><h2 className="mt-2 text-4xl font-black text-brand-dark">{institutions.length}</h2></CardContent></Card><Card><CardContent className="p-6"><p className="font-bold text-brand-muted">Campuses</p><h2 className="mt-2 text-4xl font-black text-brand-dark">{campuses.length}</h2></CardContent></Card><Card><CardContent className="p-6"><p className="font-bold text-brand-muted">Departments</p><h2 className="mt-2 text-4xl font-black text-brand-dark">{departments.length}</h2></CardContent></Card></section><Card><CardContent className="p-6"><p className="font-bold text-brand-muted">Health Score</p><h2 className="mt-2 text-5xl font-black text-brand-red">{dashboard.stats.systemHealth}%</h2></CardContent></Card></div>;
}
