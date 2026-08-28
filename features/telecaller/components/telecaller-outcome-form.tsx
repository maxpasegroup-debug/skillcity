"use client";

import { useActionState } from "react";
import { recordTelecallerOutcomeAction } from "@/actions/telecaller";
import { Button } from "@/components/ui/button";
import { DirectorFormMessage } from "@/features/director/components/director-form-message";
import { telecallerOutcomeLabels, telecallerOutcomes } from "@/features/telecaller/schemas";

const initialState = { ok: false, message: "" };

export function TelecallerOutcomeForm({ leadId, compact = false }: { leadId: string; compact?: boolean }) {
  const [state, action, pending] = useActionState(recordTelecallerOutcomeAction, initialState);

  return (
    <form action={action} className={compact ? "space-y-3" : "space-y-4"}>
      <input type="hidden" name="leadId" value={leadId} />
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-brand-dark">Call outcome</span>
        <select name="outcome" required className="h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm font-bold text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10">
          {telecallerOutcomes.map((outcome) => (
            <option key={outcome} value={outcome}>
              {telecallerOutcomeLabels[outcome]}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-brand-dark">Short note</span>
        <textarea name="note" rows={compact ? 2 : 3} className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10" />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-brand-dark">Next follow-up</span>
        <input name="nextFollowUpAt" type="datetime-local" className="h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm font-bold text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10" />
      </label>
      <Button disabled={pending} className="w-full">
        {pending ? "Saving..." : "Save outcome"}
      </Button>
    </form>
  );
}
