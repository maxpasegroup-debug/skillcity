"use client";

import { useActionState } from "react";
import { assignLeadAction, scheduleLeadFollowUpAction } from "@/actions/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DirectorFormMessage } from "@/features/director/components/director-form-message";

const initialState = { ok: false, message: "" };

export function LeadAssignmentForm({ leadId, assignedToId, assignees }: { leadId: string; assignedToId?: string | null; assignees: Array<{ id: string; name: string }> }) {
  const [state, action, pending] = useActionState(assignLeadAction, initialState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="leadId" value={leadId} />
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-brand-dark">Assigned employee</span>
        <select name="assignedToId" defaultValue={assignedToId ?? ""} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold text-brand-dark">
          <option value="">Unassigned</option>
          {assignees.map((assignee) => <option key={assignee.id} value={assignee.id}>{assignee.name}</option>)}
        </select>
      </label>
      <Button disabled={pending}>Save assignment</Button>
    </form>
  );
}

export function LeadFollowUpForm({ leadId }: { leadId: string }) {
  const [state, action, pending] = useActionState(scheduleLeadFollowUpAction, initialState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="leadId" value={leadId} />
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <Input name="scheduledAt" label="Follow-up time" type="datetime-local" required />
      <Input name="subject" label="Subject" required />
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-brand-dark">Note</span>
        <textarea name="note" required rows={4} className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-brand-dark" />
      </label>
      <Button disabled={pending}>Schedule follow-up</Button>
    </form>
  );
}
