import { Card, CardContent } from "@/components/ui/card";
import { EmployeeForm } from "@/features/executive/components/executive-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getExecutiveData } from "@/server/executive/queries";

export default async function HRPage() {
  const [institutions, campuses, departments, employees, , , , users] = await getExecutiveData();
  return <div className="space-y-10"><DirectorPageHeader eyebrow="HR" title="People operations" description="Employees, roles, departments, performance, leave and payroll architecture." /><Card><CardContent className="p-6"><EmployeeForm users={users} institutions={institutions} campuses={campuses} departments={departments} /></CardContent></Card><div className="grid gap-5 lg:grid-cols-2">{employees.map((employee) => <Card key={employee.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{employee.status} - {employee.employmentType}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{employee.user.name}</h2><p className="mt-2 font-bold text-brand-muted">{employee.title ?? "Team member"} - {employee.department?.name ?? "No department"}</p></CardContent></Card>)}</div></div>;
}
