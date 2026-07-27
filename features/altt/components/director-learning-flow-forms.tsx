"use client";

import { useActionState } from "react";
import { attachLearningFlowAction, createLearningFlowAction } from "@/actions/altt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DirectorFormMessage } from "@/features/director/components/director-form-message";

const initialState = { ok: false, message: "" };

type Option = { id: string; name: string };

export function LearningFlowForm() {
  const [state, action, pending] = useActionState(createLearningFlowAction, initialState);
  return (
    <form action={action} className="space-y-5">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <Input name="name" label="Flow Name" required />
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-brand-dark">Description</span>
        <textarea name="description" rows={3} className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-brand-dark" />
      </label>
      <Input name="version" label="Version" type="number" defaultValue={1} required />
      <Button disabled={pending}>{pending ? "Creating..." : "Create ALTT Flow"}</Button>
    </form>
  );
}

export function AttachLearningFlowForm({ flows, days }: { flows: Option[]; days: Option[] }) {
  const [state, action, pending] = useActionState(attachLearningFlowAction, initialState);
  return (
    <form action={action} className="space-y-5">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-brand-dark">Learning Flow</span>
          <select name="learningFlowId" required className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold">
            {flows.map((flow) => <option key={flow.id} value={flow.id}>{flow.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-brand-dark">Journey Day</span>
          <select name="dayId" required className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold">
            {days.map((day) => <option key={day.id} value={day.id}>{day.name}</option>)}
          </select>
        </label>
      </div>
      <Button disabled={pending}>{pending ? "Attaching..." : "Attach Flow to Day"}</Button>
    </form>
  );
}
