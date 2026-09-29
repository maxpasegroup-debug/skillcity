"use client";

import { useActionState } from "react";
import { addInternalChannelMemberAction, createInternalChannelAction, sendInternalMessageAction } from "@/actions/communications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState = { ok: false, message: "" };
type Organization = { id: string; name: string };
type ScopeOption = Organization & { institutionId: string | null; stateName?: string; districtId?: string | null; divisionId?: string | null; campusId?: string | null };
type Employee = { userId: string; employeeCode?: string | null; user: { name: string }; designation?: { name: string } | null };

function Result({ state }: { state: typeof initialState }) {
  return state.message ? <p className={state.ok ? "font-bold text-emerald-700" : "font-bold text-brand-red"}>{state.message}</p> : null;
}

export function InternalChannelForm({ institutions, divisions, districts, campuses, departments, employees }: { institutions: Organization[]; divisions: ScopeOption[]; districts: ScopeOption[]; campuses: ScopeOption[]; departments: ScopeOption[]; employees: Employee[] }) {
  const [state, action, pending] = useActionState(createInternalChannelAction, initialState);
  return (
    <form action={action} className="space-y-5">
      <Result state={state} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <label className="block"><span className="mb-2 block text-sm font-bold">Organization</span><select name="institutionId" required className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold"><option value="">Choose organization</option>{institutions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="block"><span className="mb-2 block text-sm font-bold">Channel type</span><select name="type" required className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold"><option value="TEAM">Team discussion</option><option value="ANNOUNCEMENT">Authority announcements</option></select></label>
        <label className="block"><span className="mb-2 block text-sm font-bold">Division</span><select name="divisionId" className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold"><option value="">Organization-wide</option>{divisions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="block"><span className="mb-2 block text-sm font-bold">District</span><select name="districtId" className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold"><option value="">All districts</option>{districts.map((item) => <option key={item.id} value={item.id}>{item.stateName ? `${item.stateName} / ` : ""}{item.name}</option>)}</select></label>
        <label className="block"><span className="mb-2 block text-sm font-bold">Hub / Centre</span><select name="campusId" className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold"><option value="">All hubs</option>{campuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="block"><span className="mb-2 block text-sm font-bold">Department</span><select name="departmentId" className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold"><option value="">All departments</option>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <Input name="name" label="Channel name" maxLength={160} required />
        <Input name="description" label="Purpose" maxLength={500} />
      </div>
      <fieldset><legend className="text-sm font-bold">Initial members</legend><div className="mt-3 grid max-h-64 gap-2 overflow-y-auto rounded-lg border border-black/10 bg-white p-3 sm:grid-cols-2">{employees.map((employee) => <label key={employee.userId} className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 hover:bg-brand-card"><input type="checkbox" name="memberIds" value={employee.userId} className="h-4 w-4" /><span><span className="block font-bold">{employee.user.name}</span><span className="block text-xs text-brand-muted">{employee.designation?.name ?? "Employee"}{employee.employeeCode ? ` / ${employee.employeeCode}` : ""}</span></span></label>)}{employees.length === 0 ? <p className="text-sm font-semibold text-brand-muted">No eligible employees in your scope.</p> : null}</div></fieldset>
      <Button disabled={pending}>{pending ? "Creating..." : "Create channel"}</Button>
    </form>
  );
}

export function InternalMessageForm({ channelId }: { channelId: string }) {
  const [state, action, pending] = useActionState(sendInternalMessageAction, initialState);
  return <form action={action} className="space-y-3"><input type="hidden" name="channelId" value={channelId} /><Result state={state} /><label className="block"><span className="mb-2 block text-sm font-bold">Message</span><textarea name="body" required maxLength={5000} rows={4} className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-base" /></label><Button disabled={pending}>{pending ? "Sending..." : "Send message"}</Button></form>;
}

export function AddInternalChannelMemberForm({ channelId, employees }: { channelId: string; employees: Employee[] }) {
  const [state, action, pending] = useActionState(addInternalChannelMemberAction, initialState);
  return <form action={action} className="space-y-3"><input type="hidden" name="channelId" value={channelId} /><Result state={state} /><label className="block"><span className="mb-2 block text-sm font-bold">Employee</span><select name="userId" required className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold"><option value="">Choose employee</option>{employees.map((employee) => <option key={employee.userId} value={employee.userId}>{employee.user.name} / {employee.designation?.name ?? "Employee"}</option>)}</select></label><Button variant="secondary" disabled={pending || employees.length === 0}>{pending ? "Adding..." : "Add member"}</Button></form>;
}
