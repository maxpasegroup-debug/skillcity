"use client";

import { useActionState } from "react";
import { createAdminFollowUpAction, updateAdminFollowUpStatusAction } from "@/actions/admin-follow-ups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DirectorFormMessage } from "@/features/director/components/director-form-message";

type Option = { id: string; name: string };
type OwnerOption = Option & { role: string };

const initialState = { ok: false, message: "" };

function Select({ name, label, children, required, defaultValue }: { name: string; label: string; children: React.ReactNode; required?: boolean; defaultValue?: string }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span><select name={name} required={required} defaultValue={defaultValue} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold text-brand-dark">{children}</select></label>;
}

function Textarea({ name, label, required }: { name: string; label: string; required?: boolean }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span><textarea name={name} required={required} rows={4} className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-brand-dark" /></label>;
}

export function AdminFollowUpForm({ students, batches, owners }: { students: Option[]; batches: Option[]; owners: OwnerOption[] }) {
  const [state, action, pending] = useActionState(createAdminFollowUpAction, initialState);
  return (
    <form action={action} className="space-y-5">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <div className="grid gap-4 md:grid-cols-3">
        <Select name="studentId" label="Student" required>{students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</Select>
        <Select name="batchId" label="Batch"><option value="">Use active batch</option>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</Select>
        <Select name="ownerId" label="Owner"><option value="">Assign to me</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name} - {owner.role}</option>)}</Select>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Select name="priority" label="Priority" required><option value="NORMAL">Normal</option><option value="HIGH">High</option></Select>
        <Select name="status" label="Status" required><option value="OPEN">Open</option><option value="IN_PROGRESS">In progress</option><option value="RESOLVED">Resolved</option></Select>
        <Input name="followUpAt" label="Follow-up Date" type="datetime-local" />
      </div>
      <Input name="nextAction" label="Next Action" required />
      <Textarea name="note" label="Follow-up Note" required />
      <Button disabled={pending || students.length === 0}>{pending ? "Saving..." : "Save Follow-Up"}</Button>
    </form>
  );
}

export function FollowUpStatusForm({ followUpId, currentStatus }: { followUpId: string; currentStatus: string }) {
  const [state, action, pending] = useActionState(updateAdminFollowUpStatusAction, initialState);
  return (
    <form action={action} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <input type="hidden" name="followUpId" value={followUpId} />
      <Select name="status" label="Status" required defaultValue={currentStatus}>
        {["OPEN", "IN_PROGRESS", "RESOLVED"].map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
      </Select>
      <Button disabled={pending}>{pending ? "Updating..." : "Update"}</Button>
    </form>
  );
}
