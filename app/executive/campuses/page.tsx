import { Card, CardContent } from "@/components/ui/card";
import { CampusForm, DistrictForm, DivisionForm, InstitutionForm } from "@/features/executive/components/executive-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getExecutiveData } from "@/server/executive/queries";

export default async function CampusesPage() {
  const [institutions, campuses, , , , , , , , divisions, districts] = await getExecutiveData();
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Organization" title="Organization structure" description="Manage organizations, divisions, districts, branches, centres and corporate offices." /><Card><CardContent className="p-6"><InstitutionForm /></CardContent></Card><Card><CardContent className="p-6"><DivisionForm institutions={institutions} /></CardContent></Card><Card><CardContent className="p-6"><DistrictForm institutions={institutions} /></CardContent></Card><Card><CardContent className="p-6"><CampusForm institutions={institutions} districts={districts} /></CardContent></Card><div className="grid gap-5 lg:grid-cols-2">{campuses.map((campus) => <Card key={campus.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{campus.type}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{campus.name}</h2><p className="mt-2 font-bold text-brand-muted">{campus.institution.name} - {campus.city ?? "Location pending"}</p></CardContent></Card>)}</div><p className="text-sm font-bold text-brand-muted">{divisions.length} divisions and {districts.length} districts configured.</p></div>;
}
