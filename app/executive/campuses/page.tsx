import { Card, CardContent } from "@/components/ui/card";
import { CampusForm, InstitutionForm } from "@/features/executive/components/executive-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getExecutiveData } from "@/server/executive/queries";

export default async function CampusesPage() {
  const [institutions, campuses] = await getExecutiveData();
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Campuses" title="Multi-institution architecture" description="Support institutions, campuses, departments, programs and batches under one platform." /><Card><CardContent className="p-6"><InstitutionForm /></CardContent></Card><Card><CardContent className="p-6"><CampusForm institutions={institutions} /></CardContent></Card><div className="grid gap-5 lg:grid-cols-2">{campuses.map((campus) => <Card key={campus.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{campus.status}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{campus.name}</h2><p className="mt-2 font-bold text-brand-muted">{campus.institution.name} - {campus.city ?? "City pending"}</p></CardContent></Card>)}</div></div>;
}
