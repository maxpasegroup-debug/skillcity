import { EmployeeShell } from "@/components/layout/employee-shell";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { requirePermission } from "@/server/auth/authorization";

export const dynamic = "force-dynamic";

export default async function EmployeesLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.EMPLOYEE_READ);
  return <EmployeeShell>{children}</EmployeeShell>;
}
