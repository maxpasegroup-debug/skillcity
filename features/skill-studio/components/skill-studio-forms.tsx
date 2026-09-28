"use client";

import { useActionState } from "react";
import { assignSkillStudioTrainerAction, createSkillStudioBatchAction, createSkillStudioProgramAction, updateSkillStudioProgramAction } from "@/actions/skill-studio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState = { ok: false, message: "" };
type Option = { id: string; name: string };
type OrganizationOptions = { institutions: Option[]; divisions: Option[]; campuses: Option[]; departments: Option[] };

function Message({ state }: { state: { ok: boolean; message: string } }) {
  return state.message ? <p className={`rounded-lg px-4 py-3 text-sm font-bold ${state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{state.message}</p> : null;
}

function Select({ name, label, options, required, defaultValue }: { name: string; label: string; options: Option[]; required?: boolean; defaultValue?: string }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span><select name={name} required={required} defaultValue={defaultValue} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 text-base font-semibold text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10"><option value="">Select {label.toLowerCase()}</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>;
}

function Textarea({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span><textarea name={name} rows={4} defaultValue={defaultValue} required className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10" /></label>;
}

const typeOptions = ["COURSE", "WORKSHOP", "BOOTCAMP", "MASTERCLASS", "PROFESSIONAL_PROGRAM", "CORPORATE_TRAINING"].map((id) => ({ id, name: id.replaceAll("_", " ") }));
const deliveryOptions = ["ONLINE", "OFFLINE", "HYBRID"].map((id) => ({ id, name: id }));
const learningOptions = [{ id: "STANDARD", name: "Standard" }, { id: "ALTT", name: "ALTT" }];
const statusOptions = ["DRAFT", "ACTIVE", "ARCHIVED"].map((id) => ({ id, name: id }));
const admissionOptions = ["CLOSED", "OPEN", "WAITLIST"].map((id) => ({ id, name: id }));

function ProgramFields({ options, program }: { options: OrganizationOptions; program?: { name: string; slug: string; description: string; durationDays: number; skillStudioType: string | null; deliveryMode: string | null; learningModel: string | null; status: string; admissionStatus: string; institutionId: string | null; divisionId: string | null; campusId: string | null; departmentId: string | null } }) {
  return <><div className="grid gap-4 md:grid-cols-2"><Input name="name" label="Program Name" defaultValue={program?.name} required /><Input name="slug" label="Stable Slug" defaultValue={program?.slug} placeholder="digital-marketing" required /></div><Textarea name="description" label="Description" defaultValue={program?.description} /><div className="grid gap-4 md:grid-cols-4"><Input name="durationDays" label="Duration Days" type="number" defaultValue={program?.durationDays ?? 30} required /><Select name="type" label="Program Type" options={typeOptions} defaultValue={program?.skillStudioType ?? "COURSE"} required /><Select name="deliveryMode" label="Delivery Mode" options={deliveryOptions} defaultValue={program?.deliveryMode ?? "OFFLINE"} required /><Select name="learningModel" label="Learning Model" options={learningOptions} defaultValue={program?.learningModel ?? "STANDARD"} required /></div><div className="grid gap-4 md:grid-cols-2"><Select name="status" label="Status" options={statusOptions} defaultValue={program?.status ?? "DRAFT"} required /><Select name="admissionStatus" label="Admissions" options={admissionOptions} defaultValue={program?.admissionStatus ?? "CLOSED"} required /></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Select name="institutionId" label="Organization" options={options.institutions} defaultValue={program?.institutionId ?? undefined} required /><Select name="divisionId" label="Division" options={options.divisions} defaultValue={program?.divisionId ?? undefined} required /><Select name="campusId" label="Centre" options={options.campuses} defaultValue={program?.campusId ?? undefined} /><Select name="departmentId" label="Department" options={options.departments} defaultValue={program?.departmentId ?? undefined} /></div></>;
}

export function CreateSkillStudioProgramForm({ options }: { options: OrganizationOptions }) {
  const [state, action, pending] = useActionState(createSkillStudioProgramAction, initialState);
  return <form action={action} className="space-y-5"><Message state={state} /><ProgramFields options={options} /><Button disabled={pending}>{pending ? "Creating..." : "Create Program"}</Button></form>;
}

export function UpdateSkillStudioProgramForm({ options, program }: { options: OrganizationOptions; program: Parameters<typeof ProgramFields>[0]["program"] & { id: string } }) {
  const [state, action, pending] = useActionState(updateSkillStudioProgramAction, initialState);
  return <form action={action} className="space-y-5"><Message state={state} /><input type="hidden" name="programId" value={program.id} /><ProgramFields options={options} program={program} /><Button disabled={pending}>{pending ? "Saving..." : "Save Program"}</Button></form>;
}

export function CreateSkillStudioBatchForm({ programId, journeys, campuses, defaultDelivery }: { programId: string; journeys: Option[]; campuses: Option[]; defaultDelivery: string }) {
  const [state, action, pending] = useActionState(createSkillStudioBatchAction, initialState);
  return <form action={action} className="space-y-4"><Message state={state} /><input type="hidden" name="programId" value={programId} /><div className="grid gap-4 md:grid-cols-2"><Input name="name" label="Batch Name" required /><Select name="journeyId" label="Curriculum" options={journeys} required /></div><div className="grid gap-4 md:grid-cols-3"><Select name="campusId" label="Centre" options={campuses} /><Select name="deliveryMode" label="Delivery Mode" options={deliveryOptions} defaultValue={defaultDelivery} required /><Select name="status" label="Status" options={statusOptions} defaultValue="DRAFT" required /></div><div className="grid gap-4 md:grid-cols-3"><Input name="startsAt" label="Starts At" type="datetime-local" /><Input name="endsAt" label="Ends At" type="datetime-local" /><Input name="enrollmentLimit" label="Capacity" type="number" /></div><Button disabled={pending}>{pending ? "Creating..." : "Create Batch"}</Button></form>;
}

export function AssignSkillStudioTrainerForm({ batches, trainers }: { batches: Option[]; trainers: Option[] }) {
  const [state, action, pending] = useActionState(assignSkillStudioTrainerAction, initialState);
  return <form action={action} className="space-y-4"><Message state={state} /><div className="grid gap-4 md:grid-cols-2"><Select name="batchId" label="Batch" options={batches} required /><Select name="trainerId" label="Trainer" options={trainers} required /></div><div className="grid gap-4 md:grid-cols-2"><Input name="startsAt" label="Starts At" type="datetime-local" /><Input name="endsAt" label="Ends At" type="datetime-local" /></div><Button disabled={pending}>{pending ? "Assigning..." : "Assign Trainer"}</Button></form>;
}
