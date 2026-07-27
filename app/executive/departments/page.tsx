import { Card, CardContent } from "@/components/ui/card";
import { DepartmentForm } from "@/features/executive/components/executive-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getExecutiveData } from "@/server/executive/queries";

export default async function DepartmentsPage() {
  const [institutions, campuses, departments] = await getExecutiveData();
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Departments" title="Department operating layer" description="Academic, admissions, training, finance, HR and operations teams can be organized cleanly." /><Card><CardContent className="p-6"><DepartmentForm institutions={institutions} campuses={campuses} /></CardContent></Card><div className="grid gap-5 lg:grid-cols-2">{departments.map((department) => <Card key={department.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{department.code}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{department.name}</h2><p className="mt-2 font-bold text-brand-muted">{department.campus?.name ?? department.institution?.name ?? "Platform"}</p></CardContent></Card>)}</div></div>;
}
