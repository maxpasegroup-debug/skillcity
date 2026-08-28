"use client";

import { useActionState } from "react";
import { assignStudentBatchAction } from "@/actions/admission-phase5";
import { Button } from "@/components/ui/button";
import { DirectorFormMessage } from "@/features/director/components/director-form-message";

const initialState = { ok: false, message: "" };

type BatchOption = {
  id: string;
  name: string;
  programId: string;
  journeyId: string | null;
  enrollmentLimit: number | null;
  enrolled: number;
};

export function BatchAssignmentForm({
  enrollmentId,
  programId,
  journeyId,
  batches
}: {
  enrollmentId: string;
  programId: string;
  journeyId: string;
  batches: BatchOption[];
}) {
  const [state, action, pending] = useActionState(assignStudentBatchAction, initialState);
  const eligibleBatches = batches.filter((batch) => batch.programId === programId && (!batch.journeyId || batch.journeyId === journeyId));

  return (
    <form action={action} className="space-y-4">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-brand-dark">Assign Batch</span>
        <select
          name="batchId"
          required
          className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 text-base font-semibold text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10"
        >
          <option value="">Select active batch</option>
          {eligibleBatches.map((batch) => {
            const seats = batch.enrollmentLimit ? Math.max(batch.enrollmentLimit - batch.enrolled, 0) : null;
            const full = batch.enrollmentLimit !== null && seats === 0;
            return (
              <option key={batch.id} value={batch.id} disabled={full}>
                {batch.name} - {batch.enrolled}/{batch.enrollmentLimit ?? "Open"}{full ? " FULL" : seats !== null ? `, ${seats} seats` : ""}
              </option>
            );
          })}
        </select>
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-brand-dark">Internal Note</span>
        <textarea
          name="note"
          rows={3}
          placeholder="Optional batch handoff note"
          className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10"
        />
      </label>
      <Button disabled={pending || eligibleBatches.length === 0}>{pending ? "Assigning..." : "Assign Student"}</Button>
      {eligibleBatches.length === 0 ? <p className="text-sm font-bold text-brand-red">No active matching batch is available for this program journey.</p> : null}
    </form>
  );
}
