"use client";

import { useActionState } from "react";
import { createAdvisorAssignmentAction, endAdvisorAssignmentAction } from "@/actions/advisors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DirectorFormMessage } from "@/features/director/components/director-form-message";

const initialState = { ok: false, message: "" };

type Option = { id: string; name: string };

function SelectField({ label, name, options }: { label: string; name: string; options: Option[] }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span>
      <select name={name} required className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 text-base font-semibold text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10">
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
      </select>
    </label>
  );
}

export function AdvisorAssignmentForm({
  targetType,
  advisors,
  targets
}: {
  targetType: "STUDENT" | "BATCH";
  advisors: Option[];
  targets: Option[];
}) {
  const [state, action, pending] = useActionState(createAdvisorAssignmentAction, initialState);
  const targetName = targetType === "STUDENT" ? "Student" : "Batch";
  return (
    <form action={action} className="space-y-5">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <input type="hidden" name="targetType" value={targetType} />
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField name="advisorId" label="Academic Advisor" options={advisors} />
        <SelectField name={targetType === "STUDENT" ? "studentId" : "batchId"} label={targetName} options={targets} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input name="startsAt" label="Starts At" type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} required />
        <Input name="endsAt" label="Ends At" type="datetime-local" />
      </div>
      <Button disabled={pending}>{pending ? "Assigning..." : `Assign to ${targetName}`}</Button>
    </form>
  );
}

export function EndAdvisorAssignmentForm({ assignmentId }: { assignmentId: string }) {
  const [, action, pending] = useActionState(endAdvisorAssignmentAction, initialState);
  return (
    <form action={action}>
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Ending..." : "End Assignment"}</Button>
    </form>
  );
}
