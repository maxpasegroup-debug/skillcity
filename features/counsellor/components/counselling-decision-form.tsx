"use client";

import { useActionState } from "react";
import { saveCounsellingDecisionAction } from "@/actions/counsellor";
import { Button } from "@/components/ui/button";
import { DirectorFormMessage } from "@/features/director/components/director-form-message";
import { counsellorOutcomeLabels, counsellorOutcomes, nextActionLabels, nextActionOptions, readinessLabels, readinessOptions } from "@/features/counsellor/schemas";

const initialState = { ok: false, message: "" };

type ProgramOption = { id: string; name: string };

export function CounsellingDecisionForm({ leadId, programs, compact = false }: { leadId: string; programs: ProgramOption[]; compact?: boolean }) {
  const [state, action, pending] = useActionState(saveCounsellingDecisionAction, initialState);

  return (
    <form action={action} className={compact ? "space-y-3" : "space-y-4"}>
      <input type="hidden" name="leadId" value={leadId} />
      <DirectorFormMessage message={state.message} ok={state.ok} />
      {!compact ? (
        <div className="grid gap-4 md:grid-cols-2">
          <TextArea name="candidateObjective" label="Candidate objective" rows={2} />
          <TextArea name="currentSituation" label="Current situation" rows={2} />
          <TextArea name="questions" label="Questions / concerns" rows={2} />
          <TextArea name="notes" label="Counsellor notes" rows={2} required />
        </div>
      ) : (
        <TextArea name="notes" label="Counsellor notes" rows={3} required />
      )}
      <div className={compact ? "space-y-3" : "grid gap-4 md:grid-cols-2"}>
        <Select name="recommendedProgramId" label="Recommended program">
          <option value="">Keep current program</option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.name}
            </option>
          ))}
        </Select>
        <Select name="readiness" label="Readiness" required>
          {readinessOptions.map((option) => (
            <option key={option} value={option}>
              {readinessLabels[option]}
            </option>
          ))}
        </Select>
        <Select name="outcome" label="Outcome" required>
          {counsellorOutcomes.map((outcome) => (
            <option key={outcome} value={outcome}>
              {counsellorOutcomeLabels[outcome]}
            </option>
          ))}
        </Select>
        <Select name="nextAction" label="Next action" required>
          {nextActionOptions.map((option) => (
            <option key={option} value={option}>
              {nextActionLabels[option]}
            </option>
          ))}
        </Select>
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-brand-dark">Follow-up date</span>
          <input name="followUpAt" type="datetime-local" className="h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm font-bold text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10" />
        </label>
      </div>
      <Button disabled={pending} className="w-full">
        {pending ? "Saving..." : "Save counselling"}
      </Button>
    </form>
  );
}

function Select({ name, label, children, required }: { name: string; label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span>
      <select name={name} required={required} className="h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm font-bold text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10">
        {children}
      </select>
    </label>
  );
}

function TextArea({ name, label, rows, required }: { name: string; label: string; rows: number; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span>
      <textarea name={name} rows={rows} required={required} className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10" />
    </label>
  );
}
