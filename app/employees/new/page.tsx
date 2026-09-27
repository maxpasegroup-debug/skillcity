import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmployeeForm } from "@/features/employees/components/employee-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getEmployeeFormOptions } from "@/server/employees/service";

export default async function NewEmployeePage() {
  const options = await getEmployeeFormOptions(PERMISSIONS.EMPLOYEE_CREATE);
  return <div className="space-y-8"><div className="flex flex-wrap items-end justify-between gap-4"><DirectorPageHeader eyebrow="People" title="Create Employee" description="Link an existing User identity to a scoped personnel record." /><Button asChild variant="secondary"><Link href="/employees"><ArrowLeft className="h-5 w-5" />Directory</Link></Button></div><Card><CardContent className="p-6 md:p-8"><EmployeeForm options={options} /></CardContent></Card></div>;
}
