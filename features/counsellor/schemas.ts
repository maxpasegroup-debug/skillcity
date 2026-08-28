import { z } from "zod";

export const counsellorOutcomes = [
  "ADMISSION_RECOMMENDED",
  "APPLICATION_PENDING",
  "FOLLOW_UP_REQUIRED",
  "NEEDS_MORE_INFORMATION",
  "ON_HOLD",
  "NOT_INTERESTED",
  "NOT_ELIGIBLE"
] as const;

export type CounsellorOutcome = (typeof counsellorOutcomes)[number];

export const counsellorOutcomeLabels: Record<CounsellorOutcome, string> = {
  ADMISSION_RECOMMENDED: "Admission Recommended",
  APPLICATION_PENDING: "Application Pending",
  FOLLOW_UP_REQUIRED: "Follow-up Required",
  NEEDS_MORE_INFORMATION: "Needs More Information",
  ON_HOLD: "On Hold",
  NOT_INTERESTED: "Not Interested",
  NOT_ELIGIBLE: "Not Eligible"
};

export const readinessOptions = ["READY", "NEEDS_TIME", "NOT_READY"] as const;

export const readinessLabels: Record<(typeof readinessOptions)[number], string> = {
  READY: "Ready",
  NEEDS_TIME: "Needs Time",
  NOT_READY: "Not Ready"
};

export const nextActionOptions = [
  "MOVE_TO_ADMISSION",
  "REQUEST_APPLICATION",
  "FOLLOW_UP",
  "SHARE_INFORMATION",
  "HOLD",
  "CLOSE"
] as const;

export const nextActionLabels: Record<(typeof nextActionOptions)[number], string> = {
  MOVE_TO_ADMISSION: "Move to Admission",
  REQUEST_APPLICATION: "Request Application",
  FOLLOW_UP: "Follow Up",
  SHARE_INFORMATION: "Share Information",
  HOLD: "Hold",
  CLOSE: "Close"
};

export const counsellingDecisionSchema = z.object({
  leadId: z.string().uuid("Lead is required."),
  candidateObjective: z.string().trim().max(600, "Keep the objective short.").optional(),
  currentSituation: z.string().trim().max(600, "Keep the situation short.").optional(),
  questions: z.string().trim().max(800, "Keep questions under 800 characters.").optional(),
  notes: z.string().trim().min(2, "Add a short counselling note.").max(1200, "Keep notes under 1200 characters."),
  recommendedProgramId: z.string().uuid().optional().or(z.literal("")),
  readiness: z.enum(readinessOptions),
  outcome: z.enum(counsellorOutcomes),
  nextAction: z.enum(nextActionOptions),
  followUpAt: z.string().trim().optional()
});

export type CounsellingDecisionInput = z.infer<typeof counsellingDecisionSchema>;
