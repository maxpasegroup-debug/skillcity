export const SKILL_STUDIO_PROGRAM_TYPES = ["COURSE", "WORKSHOP", "BOOTCAMP", "MASTERCLASS", "PROFESSIONAL_PROGRAM", "CORPORATE_TRAINING"] as const;
export const PROGRAM_DELIVERY_MODES = ["ONLINE", "OFFLINE", "HYBRID"] as const;
export const PROGRAM_LEARNING_MODELS = ["STANDARD", "ALTT"] as const;

export function normalizeProgramSlug(value: string) {
  return value.trim().toLowerCase();
}

export function usesAltt(input: { operatingDomain?: string | null; learningModel?: string | null }) {
  if (input.operatingDomain === "SKILL_STUDIO") return input.learningModel === "ALTT";
  return true;
}

export function validateSkillStudioBatch(input: {
  programId: string;
  programCampusId?: string | null;
  programDeliveryMode?: string | null;
  journeyProgramId?: string | null;
  campusId?: string | null;
  deliveryMode?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  enrollmentLimit?: number | null;
}) {
  const issues: string[] = [];
  if (input.journeyProgramId && input.journeyProgramId !== input.programId) issues.push("Journey belongs to another program.");
  if (input.programCampusId && input.campusId && input.programCampusId !== input.campusId) issues.push("Batch centre conflicts with the program centre.");
  if (input.startsAt && input.endsAt && input.endsAt <= input.startsAt) issues.push("Batch end date must be after its start date.");
  if (input.enrollmentLimit != null && input.enrollmentLimit < 1) issues.push("Batch capacity must be positive.");
  const deliveryMode = input.deliveryMode ?? input.programDeliveryMode;
  if ((deliveryMode === "OFFLINE" || deliveryMode === "HYBRID") && !input.campusId && !input.programCampusId) {
    issues.push("Offline and hybrid batches require a centre.");
  }
  return issues;
}
