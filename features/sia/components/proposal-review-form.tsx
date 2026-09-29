"use client";

import { useActionState } from "react";
import { Check, X } from "lucide-react";
import { approveAIActionProposalAction, rejectAIActionProposalAction } from "@/actions/ai";
import { Button } from "@/components/ui/button";

const initialState = { ok: false, message: "" };

export function ProposalReviewForm({ proposalId }: { proposalId: string }) {
  const [approveState, approveAction, approving] = useActionState(approveAIActionProposalAction, initialState);
  const [rejectState, rejectAction, rejecting] = useActionState(rejectAIActionProposalAction, initialState);
  const state = approveState.message ? approveState : rejectState;

  return (
    <div className="space-y-3">
      {state.message ? <p className={state.ok ? "text-sm font-bold text-emerald-700" : "text-sm font-bold text-brand-red"}>{state.message}</p> : null}
      <form action={approveAction} className="flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="proposalId" value={proposalId} />
        <input name="reviewNote" maxLength={500} aria-label="Approval note" placeholder="Optional review note" className="h-11 min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 text-sm" />
        <Button size="md" className="h-11 px-4" disabled={approving || rejecting}><Check className="h-4 w-4" />Approve</Button>
      </form>
      <form action={rejectAction} className="flex justify-end">
        <input type="hidden" name="proposalId" value={proposalId} />
        <Button variant="secondary" size="md" className="h-10 px-4 text-sm" disabled={approving || rejecting}><X className="h-4 w-4" />Reject</Button>
      </form>
    </div>
  );
}
