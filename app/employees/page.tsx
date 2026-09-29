import Link from "next/link";
import { Plus, Search, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getEmployeeDirectory } from "@/server/employees/service";

export default async function EmployeeDirectoryPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const params = await searchParams;
  const { employees, canCreate } = await getEmployeeDirectory(params.search);
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <DirectorPageHeader eyebrow="People" title="Employee Directory" description="Personnel records and organizational placements within your authorized scope." />
        {canCreate ? <Button asChild><Link href="/employees/new"><Plus className="h-5 w-5" />Create Employee</Link></Button> : null}
      </div>
      <form className="flex max-w-xl items-end gap-3">
        <div className="flex-1"><Input name="search" label="Search employees" defaultValue={params.search ?? ""} placeholder="Name, code, email or designation" /></div>
        <Button type="submit" variant="secondary" aria-label="Search"><Search className="h-5 w-5" /></Button>
      </form>
      <div className="grid gap-4 lg:hidden">
        {employees.map((employee) => (
          <Link key={employee.id} href={`/employees/${employee.id}`} className="block rounded-lg border border-black/8 bg-white p-5 shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-red">
            <div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-card"><UserRound className="h-5 w-5" /></span><div className="min-w-0"><h2 className="truncate text-lg font-black text-brand-dark">{employee.user.name}</h2><p className="mt-1 text-sm font-bold text-brand-muted">{employee.employeeCode ?? "Code migration required"}</p></div></div><span className="text-xs font-black uppercase text-brand-red">{employee.status.replaceAll("_", " ")}</span></div>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm"><div><dt className="font-bold text-brand-muted">Designation</dt><dd className="mt-1 font-semibold text-brand-dark">{employee.designation?.name ?? employee.title ?? "Unassigned"}</dd></div><div><dt className="font-bold text-brand-muted">Department</dt><dd className="mt-1 font-semibold text-brand-dark">{employee.department?.name ?? "-"}</dd></div><div><dt className="font-bold text-brand-muted">Division</dt><dd className="mt-1 font-semibold text-brand-dark">{employee.division?.name ?? "-"}</dd></div><div><dt className="font-bold text-brand-muted">Branch / Centre</dt><dd className="mt-1 font-semibold text-brand-dark">{employee.campus?.name ?? "-"}</dd></div></dl>
          </Link>
        ))}
        {employees.length === 0 ? <Card><CardContent className="p-6 text-center font-semibold text-brand-muted">No employees found in your authorized scope.</CardContent></Card> : null}
      </div>
      <Card className="hidden overflow-hidden lg:block">
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead className="bg-brand-card text-sm text-brand-muted"><tr><th className="px-5 py-4">Employee</th><th className="px-5 py-4">Code</th><th className="px-5 py-4">Designation</th><th className="px-5 py-4">Department</th><th className="px-5 py-4">Division</th><th className="px-5 py-4">District</th><th className="px-5 py-4">Branch / Centre</th><th className="px-5 py-4">Status</th></tr></thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-t border-black/8">
                  <td className="px-5 py-4"><Link href={`/employees/${employee.id}`} className="flex items-center gap-3 font-black text-brand-dark hover:text-brand-red"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-card"><UserRound className="h-5 w-5" /></span>{employee.user.name}</Link></td>
                  <td className="px-5 py-4 font-bold text-brand-muted">{employee.employeeCode ?? "Migration required"}</td>
                  <td className="px-5 py-4 font-semibold">{employee.designation?.name ?? employee.title ?? "Unassigned"}</td>
                  <td className="px-5 py-4">{employee.department?.name ?? "-"}</td>
                  <td className="px-5 py-4">{employee.division?.name ?? "-"}</td>
                  <td className="px-5 py-4">{employee.district?.name ?? "-"}</td>
                  <td className="px-5 py-4">{employee.campus?.name ?? "-"}</td>
                  <td className="px-5 py-4 font-black text-brand-red">{employee.status.replaceAll("_", " ")}</td>
                </tr>
              ))}
              {employees.length === 0 ? <tr><td colSpan={8} className="px-5 py-12 text-center font-semibold text-brand-muted">No employees found in your authorized scope.</td></tr> : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
