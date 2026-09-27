import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmployeeForm } from "@/features/employees/components/employee-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getEmployeeFormOptions, getEmployeeForEdit } from "@/server/employees/service";

export default async function EditEmployeePage({ params }: { params: Promise<{ employeeId: string }> }) {
  const { employeeId } = await params;
  const [employee, options] = await Promise.all([getEmployeeForEdit(employeeId), getEmployeeFormOptions(PERMISSIONS.EMPLOYEE_UPDATE)]);
  if (!employee) notFound();
  return <div className="space-y-8"><div className="flex flex-wrap items-end justify-between gap-4"><DirectorPageHeader eyebrow="People" title={`Edit ${employee.user.name}`} description="Update employment and primary organizational placement." /><Button asChild variant="secondary"><Link href={`/employees/${employee.id}`}><ArrowLeft className="h-5 w-5" />Employee</Link></Button></div><Card><CardContent className="p-6 md:p-8"><EmployeeForm options={options} employee={employee} /></CardContent></Card></div>;
}
