"use client";

import { useActionState } from "react";
import { addLabsContributorAction, createLabsProductAction, endLabsAssignmentAction, replaceLabsOwnerAction, updateLabsProductAction } from "@/actions/labs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState = { ok: false, message: "" };
type Option = { id: string; name: string };
type OrganizationOptions = { institutions: Option[]; divisions: Option[]; districts: Option[]; campuses: Option[]; departments: Option[]; employees: Option[] };

function Message({ state }: { state: { ok: boolean; message: string } }) {
  return state.message ? <p className={`rounded-lg px-4 py-3 text-sm font-bold ${state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{state.message}</p> : null;
}

function Select({ name, label, options, required, defaultValue }: { name: string; label: string; options: Option[]; required?: boolean; defaultValue?: string }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span><select name={name} required={required} defaultValue={defaultValue} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 text-base font-semibold text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10"><option value="">Select {label.toLowerCase()}</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>;
}

function Textarea({ name, label, defaultValue, required }: { name: string; label: string; defaultValue?: string; required?: boolean }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span><textarea name={name} rows={4} defaultValue={defaultValue} required={required} className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10" /></label>;
}

const typeOptions = ["PLATFORM", "APPLICATION", "AI_PRODUCT", "INTERNAL_TOOL", "AUTOMATION", "SERVICE"].map((value) => ({ id: value, name: value.replaceAll("_", " ") }));
const lifecycleOptions = ["IDEA", "PLANNING", "BUILDING", "PILOT", "LIVE", "MAINTENANCE", "ARCHIVED"].map((value) => ({ id: value, name: value.replaceAll("_", " ") }));

export function CreateLabsProductForm({ options }: { options: OrganizationOptions }) {
  const [state, action, pending] = useActionState(createLabsProductAction, initialState);
  return <form action={action} className="space-y-5"><Message state={state} /><div className="grid gap-4 md:grid-cols-2"><Input name="name" label="Product Name" required /><Input name="code" label="Product Code" placeholder="stable-product-code" required /></div><Textarea name="description" label="Description" required /><div className="grid gap-4 md:grid-cols-3"><Select name="type" label="Product Type" options={typeOptions} required /><Select name="lifecycle" label="Lifecycle" options={lifecycleOptions} required defaultValue="IDEA" /><Select name="ownerId" label="Primary Owner" options={options.employees} required /></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><Select name="institutionId" label="Organization" options={options.institutions} required /><Select name="divisionId" label="Division" options={options.divisions} required /><Select name="districtId" label="District" options={options.districts} /><Select name="campusId" label="Centre" options={options.campuses} /><Select name="departmentId" label="Department" options={options.departments} /></div><Button disabled={pending}>{pending ? "Creating..." : "Create Product"}</Button></form>;
}

export function UpdateLabsProductForm({ product }: { product: { id: string; code: string; name: string; description: string; type: string; lifecycle: string; institutionId: string; divisionId: string; districtId: string | null; campusId: string | null; departmentId: string | null } }) {
  const [state, action, pending] = useActionState(updateLabsProductAction, initialState);
  return <form action={action} className="space-y-5"><Message state={state} /><input type="hidden" name="productId" value={product.id} /><input type="hidden" name="code" value={product.code} /><input type="hidden" name="institutionId" value={product.institutionId} /><input type="hidden" name="divisionId" value={product.divisionId} />{product.districtId ? <input type="hidden" name="districtId" value={product.districtId} /> : null}{product.campusId ? <input type="hidden" name="campusId" value={product.campusId} /> : null}{product.departmentId ? <input type="hidden" name="departmentId" value={product.departmentId} /> : null}<div className="grid gap-4 md:grid-cols-2"><Input name="name" label="Product Name" defaultValue={product.name} required /><Select name="type" label="Product Type" options={typeOptions} defaultValue={product.type} required /></div><Textarea name="description" label="Description" defaultValue={product.description} required /><Select name="lifecycle" label="Lifecycle" options={lifecycleOptions} defaultValue={product.lifecycle} required /><Button disabled={pending}>{pending ? "Saving..." : "Save Product"}</Button></form>;
}

export function ReplaceLabsOwnerForm({ productId, employees }: { productId: string; employees: Option[] }) {
  const [state, action, pending] = useActionState(replaceLabsOwnerAction, initialState);
  return <form action={action} className="space-y-4"><Message state={state} /><input type="hidden" name="productId" value={productId} /><Select name="employeeId" label="New Primary Owner" options={employees} required /><Button disabled={pending}>{pending ? "Replacing..." : "Replace Owner"}</Button></form>;
}

export function AddLabsContributorForm({ productId, employees }: { productId: string; employees: Option[] }) {
  const [state, action, pending] = useActionState(addLabsContributorAction, initialState);
  return <form action={action} className="space-y-4"><Message state={state} /><input type="hidden" name="productId" value={productId} /><div className="grid gap-4 md:grid-cols-2"><Select name="employeeId" label="Employee" options={employees} required /><Input name="responsibility" label="Responsibility" placeholder="Development, design, QA..." required /></div><div className="grid gap-4 md:grid-cols-2"><Input name="startsAt" label="Starts At" type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} required /><Input name="endsAt" label="Ends At" type="datetime-local" /></div><Button disabled={pending}>{pending ? "Assigning..." : "Add Contributor"}</Button></form>;
}

export function EndLabsAssignmentForm({ productId, assignmentId }: { productId: string; assignmentId: string }) {
  const [state, action, pending] = useActionState(endLabsAssignmentAction, initialState);
  return <form action={action} className="flex items-center gap-3"><input type="hidden" name="productId" value={productId} /><input type="hidden" name="assignmentId" value={assignmentId} />{state.message ? <span className="text-sm font-bold text-brand-muted">{state.message}</span> : null}<Button type="submit" variant="secondary" disabled={pending}>{pending ? "Ending..." : "End"}</Button></form>;
}
