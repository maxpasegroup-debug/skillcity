import { z } from "zod";

export const telecallerOutcomes = [
  "INTERESTED",
  "NEEDS_MORE_INFORMATION",
  "CALLBACK_REQUESTED",
  "NOT_INTERESTED",
  "WRONG_NUMBER",
  "NO_ANSWER",
  "QUALIFIED",
  "SENT_TO_COUNSELLOR"
] as const;

export type TelecallerOutcome = (typeof telecallerOutcomes)[number];

export const telecallerOutcomeLabels: Record<TelecallerOutcome, string> = {
  INTERESTED: "Interested",
  NEEDS_MORE_INFORMATION: "Needs More Information",
  CALLBACK_REQUESTED: "Callback Requested",
  NOT_INTERESTED: "Not Interested",
  WRONG_NUMBER: "Wrong Number",
  NO_ANSWER: "No Answer",
  QUALIFIED: "Qualified",
  SENT_TO_COUNSELLOR: "Sent to Counsellor"
};

export const telecallerOutcomeSchema = z.object({
  leadId: z.string().uuid("Lead is required."),
  outcome: z.enum(telecallerOutcomes),
  note: z.string().trim().max(800, "Keep the note under 800 characters.").optional(),
  nextFollowUpAt: z.string().trim().optional()
});

export type TelecallerOutcomeInput = z.infer<typeof telecallerOutcomeSchema>;
