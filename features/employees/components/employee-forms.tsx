"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addEmployeeAssignmentAction, createEmployeeAction, deactivateEmployeeAction, endEmployeeAssignmentAction, updateEmployeeAction, type EmployeeActionState } from "@/actions/employees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DirectorFormMessage } from "@/features/director/components/director-form-message";

const initialState: EmployeeActionState = { ok: false, message: "" };
type NamedOption = { id: string; name: string };
type OrganizationOption = NamedOption & { institutionId: string };
type DistrictOption = OrganizationOption & { stateName: string };
type CampusOption = OrganizationOption & { districtId: string | null };
type DepartmentOption = NamedOption & { institutionId: string | null; divisionId: string | null; campusId: string | null };
type ManagerOption = { id: string; employeeCode: string | null; institutionId: string | null; user: { name: string }; organizationAssignments: Array<{ institutionId: string }> };

export type EmployeeFormOptions = {
  institutions: NamedOption[];
  divisions: OrganizationOption[];
  districts: DistrictOption[];
  campuses: CampusOption[];
  departments: DepartmentOption[];
  designations: NamedOption[];
  managers: ManagerOption[];
};

export type EmployeeFormValue = {
  id: string;
  employeeCode: string | null;
  designationId: string | null;
  managerId: string | null;
  institutionId: string | null;
  divisionId: string | null;
  districtId: string | null;
  campusId: string | null;
  departmentId: string | null;
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
  status: "ACTIVE" | "PROBATION" | "ON_LEAVE" | "ON_NOTICE" | "INACTIVE" | "EXITED";
  joinedAt: Date | null;
  exitedAt: Date | null;
};

function Select({ name, label, defaultValue, children, required }: { name: string; label: string; defaultValue?: string; children: React.ReactNode; required?: boolean }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span><select name={name} defaultValue={defaultValue} required={required} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold text-brand-dark">{children}</select></label>;
}

function dateValue(value: Date | null | undefined) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

export function EmployeeForm({ options, employee }: { options: EmployeeFormOptions; employee?: EmployeeFormValue }) {
  const router = useRouter();
  const action = employee ? updateEmployeeAction : createEmployeeAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [institutionId, setInstitutionId] = useState(employee?.institutionId ?? options.institutions[0]?.id ?? "");
  const divisions = useMemo(() => options.divisions.filter((item) => item.institutionId === institutionId), [options.divisions, institutionId]);
  const districts = useMemo(() => options.districts.filter((item) => item.institutionId === institutionId), [options.districts, institutionId]);
  const campuses = useMemo(() => options.campuses.filter((item) => item.institutionId === institutionId), [options.campuses, institutionId]);
  const departments = useMemo(() => options.departments.filter((item) => !item.institutionId || item.institutionId === institutionId), [options.departments, institutionId]);
  const managers = useMemo(() => options.managers.filter((item) => item.id !== employee?.id && (item.institutionId === institutionId || item.organizationAssignments.some((assignment) => assignment.institutionId === institutionId))), [options.managers, employee?.id, institutionId]);

  useEffect(() => {
    if (state.ok && state.employeeId) router.push(`/employees/${state.employeeId}`);
  }, [router, state.employeeId, state.ok]);

  return (
    <form action={formAction} className="space-y-6">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      {employee ? <input type="hidden" name="employeeId" value={employee.id} /> : <Input name="userEmail" type="email" label="Linked User Email" placeholder="employee@company.com" required />}
      <div className="grid gap-4 md:grid-cols-3">
        <Input name="employeeCode" label="Employee Code" defaultValue={employee?.employeeCode ?? ""} required />
        <Select name="designationId" label="Designation" defaultValue={employee?.designationId ?? ""} required><option value="" disabled>Select designation</option>{options.designations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
        <Select name="managerId" label="Reporting Manager" defaultValue={employee?.managerId ?? ""}><option value="">No reporting manager</option>{managers.map((item) => <option key={item.id} value={item.id}>{item.user.name}{item.employeeCode ? ` (${item.employeeCode})` : ""}</option>)}</Select>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="block"><span className="mb-2 block text-sm font-bold text-brand-dark">Organization</span><select name="institutionId" value={institutionId} onChange={(event) => setInstitutionId(event.target.value)} required className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold text-brand-dark"><option value="" disabled>Select organization</option>{options.institutions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <Select name="divisionId" label="Division" defaultValue={employee?.divisionId ?? ""}><option value="">No division</option>{divisions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
        <Select name="districtId" label="District" defaultValue={employee?.districtId ?? ""}><option value="">No district</option>{districts.map((item) => <option key={item.id} value={item.id}>{item.name}, {item.stateName}</option>)}</Select>
        <Select name="campusId" label="Branch / Centre" defaultValue={employee?.campusId ?? ""}><option value="">No branch / centre</option>{campuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
        <Select name="departmentId" label="Department" defaultValue={employee?.departmentId ?? ""}><option value="">No department</option>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Select name="employmentType" label="Employment Type" defaultValue={employee?.employmentType ?? "FULL_TIME"} required><option value="FULL_TIME">Full Time</option><option value="PART_TIME">Part Time</option><option value="CONTRACT">Contract</option><option value="INTERN">Intern</option></Select>
        <Select name="status" label="Employment Status" defaultValue={employee?.status ?? "ACTIVE"} required><option value="ACTIVE">Active</option><option value="PROBATION">Probation</option><option value="ON_LEAVE">On Leave</option><option value="ON_NOTICE">On Notice</option><option value="INACTIVE">Inactive</option><option value="EXITED">Exited</option></Select>
        <Input name="joinedAt" type="date" label="Joining Date" defaultValue={dateValue(employee?.joinedAt)} />
        <Input name="exitedAt" type="date" label="Exit Date" defaultValue={dateValue(employee?.exitedAt)} />
      </div>
      <Button disabled={pending}>{employee ? "Update Employee" : "Create Employee"}</Button>
    </form>
  );
}

export function EmployeeAssignmentForm({ employeeId, options }: { employeeId: string; options: EmployeeFormOptions }) {
  const [state, action, pending] = useActionState(addEmployeeAssignmentAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><input type="hidden" name="employeeId" value={employeeId} /><div className="grid gap-4 md:grid-cols-3"><Select name="institutionId" label="Organization" required><option value="" disabled>Select organization</option>{options.institutions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Select name="divisionId" label="Division"><option value="">No division</option>{options.divisions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Select name="districtId" label="District"><option value="">No district</option>{options.districts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Select name="campusId" label="Branch / Centre"><option value="">No branch / centre</option>{options.campuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Select name="departmentId" label="Department"><option value="">No department</option>{options.departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Select name="designationId" label="Assignment Designation"><option value="">Use primary designation</option>{options.designations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Input name="startsAt" type="date" label="Effective From" defaultValue={dateValue(new Date())} required /><Input name="endsAt" type="date" label="Effective Until" /></div><Button disabled={pending}>Add Assignment</Button></form>;
}

export function EndAssignmentForm({ employeeId, assignmentId }: { employeeId: string; assignmentId: string }) {
  const [, action, pending] = useActionState(endEmployeeAssignmentAction, initialState);
  return <form action={action}><input type="hidden" name="employeeId" value={employeeId} /><input type="hidden" name="assignmentId" value={assignmentId} /><Button type="submit" variant="secondary" disabled={pending}>End Assignment</Button></form>;
}

export function DeactivateEmployeeForm({ employeeId }: { employeeId: string }) {
  const [state, action, pending] = useActionState(deactivateEmployeeAction, initialState);
  return <form action={action} className="flex flex-col gap-4 sm:flex-row sm:items-end"><input type="hidden" name="employeeId" value={employeeId} /><div className="flex-1"><DirectorFormMessage message={state.message} ok={state.ok} /><Input name="exitedAt" type="date" label="Exit Date" defaultValue={dateValue(new Date())} required /></div><Button type="submit" variant="secondary" disabled={pending}>Deactivate Employee</Button></form>;
}
