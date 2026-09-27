import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Pencil, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DeactivateEmployeeForm, EmployeeAssignmentForm, EndAssignmentForm } from "@/features/employees/components/employee-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getEmployeeDetail, getEmployeeFormOptions } from "@/server/employees/service";

function displayDate(value: Date | null) {
  return value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(value) : "Not recorded";
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-sm font-bold text-brand-muted">{label}</dt><dd className="mt-1 font-black text-brand-dark">{value}</dd></div>;
}

export default async function EmployeeDetailPage({ params }: { params: Promise<{ employeeId: string }> }) {
  const { employeeId } = await params;
  const detail = await getEmployeeDetail(employeeId);
  if (!detail) notFound();
  const { employee, canUpdate, canManage } = detail;
  const options = canUpdate ? await getEmployeeFormOptions(PERMISSIONS.EMPLOYEE_UPDATE) : null;
  const now = new Date();
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <DirectorPageHeader eyebrow={employee.employeeCode ?? "Employee code pending"} title={employee.user.name} description={`${employee.designation?.name ?? employee.title ?? "Designation pending"} - ${employee.status.replaceAll("_", " ")}`} />
        <div className="flex gap-3"><Button asChild variant="secondary"><Link href="/employees"><ArrowLeft className="h-5 w-5" />Directory</Link></Button>{canUpdate ? <Button asChild><Link href={`/employees/${employee.id}/edit`}><Pencil className="h-5 w-5" />Edit</Link></Button> : null}</div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card><CardContent className="p-6"><h2 className="flex items-center gap-2 text-xl font-black"><UserRound className="h-5 w-5 text-brand-red" />Overview</h2><dl className="mt-6 grid gap-5 sm:grid-cols-2"><Detail label="Employee Code" value={employee.employeeCode ?? "Migration required"} /><Detail label="Designation" value={employee.designation?.name ?? employee.title ?? "Unassigned"} /><Detail label="Employment Status" value={employee.status.replaceAll("_", " ")} /><Detail label="Employment Type" value={employee.employmentType.replaceAll("_", " ")} /><Detail label="Joining Date" value={displayDate(employee.joinedAt)} /><Detail label="Exit Date" value={displayDate(employee.exitedAt)} /></dl></CardContent></Card>
        <Card><CardContent className="p-6"><h2 className="flex items-center gap-2 text-xl font-black"><Building2 className="h-5 w-5 text-brand-red" />Organization</h2><dl className="mt-6 grid gap-5 sm:grid-cols-2"><Detail label="Organization" value={employee.institution?.name ?? "Unassigned"} /><Detail label="Division" value={employee.division?.name ?? "Unassigned"} /><Detail label="District" value={employee.district?.name ?? "Unassigned"} /><Detail label="Branch / Centre" value={employee.campus?.name ?? "Unassigned"} /><Detail label="Department" value={employee.department?.name ?? "Unassigned"} /><Detail label="Reporting Manager" value={employee.manager?.user.name ?? "No manager"} /></dl></CardContent></Card>
      </div>
      <Card><CardContent className="p-6"><h2 className="text-xl font-black">Identity</h2><dl className="mt-5 grid gap-5 sm:grid-cols-3"><Detail label="Linked User" value={employee.user.name} /><Detail label="Official Email" value={employee.user.email} /><Detail label="Authorization Roles" value={employee.user.roles.map(({ role }) => role.name).join(", ") || "No roles"} /></dl></CardContent></Card>
      <section className="space-y-4"><h2 className="text-2xl font-black">Additional Assignments</h2>{employee.organizationAssignments.map((assignment) => { const active = assignment.startsAt <= now && (!assignment.endsAt || assignment.endsAt > now); return <Card key={assignment.id}><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black">{assignment.institution.name} - {assignment.designationRecord?.name ?? assignment.designation ?? "Additional assignment"}</p><p className="mt-1 text-sm font-semibold text-brand-muted">{[assignment.division?.name, assignment.district?.name, assignment.campus?.name, assignment.department?.name].filter(Boolean).join(" / ") || "Organization-wide"}</p><p className="mt-1 text-sm font-bold text-brand-red">{active ? "ACTIVE" : "INACTIVE"} - {displayDate(assignment.startsAt)} to {displayDate(assignment.endsAt)}</p></div>{canUpdate && active ? <EndAssignmentForm employeeId={employee.id} assignmentId={assignment.id} /> : null}</CardContent></Card>; })}{employee.organizationAssignments.length === 0 ? <p className="font-semibold text-brand-muted">No additional assignments.</p> : null}</section>
      {canUpdate && options ? <Card><CardContent className="p-6"><h2 className="mb-5 text-xl font-black">Add Organization Assignment</h2><EmployeeAssignmentForm employeeId={employee.id} options={options} /></CardContent></Card> : null}
      {canManage && employee.status !== "INACTIVE" && employee.status !== "EXITED" ? <Card><CardContent className="p-6"><h2 className="mb-4 text-xl font-black">Employment Deactivation</h2><DeactivateEmployeeForm employeeId={employee.id} /></CardContent></Card> : null}
    </div>
  );
}
