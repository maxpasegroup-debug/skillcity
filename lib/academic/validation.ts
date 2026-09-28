export function validateBatchConfiguration(input: {
  program: { id: string; campusId?: string | null };
  journey?: { programId: string } | null;
  campusId?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  enrollmentLimit?: number | null;
}) {
  const issues: string[] = [];
  if (input.journey && input.journey.programId !== input.program.id) issues.push("Journey belongs to another program.");
  if (input.program.campusId && input.campusId && input.program.campusId !== input.campusId) issues.push("Batch centre conflicts with the program centre.");
  if (input.startsAt && input.endsAt && input.endsAt <= input.startsAt) issues.push("Batch end date must be after its start date.");
  if (input.enrollmentLimit != null && input.enrollmentLimit < 1) issues.push("Batch capacity must be positive.");
  return issues;
}

export function hasEffectiveAssignment(input: { status: string; startsAt?: Date | null; endsAt?: Date | null }, now = new Date()) {
  return input.status === "ACTIVE" && (!input.startsAt || input.startsAt <= now) && (!input.endsAt || input.endsAt >= now);
}

export function assignmentCoversAcademicResource(
  assignment: { institutionId?: string | null; divisionId?: string | null; campusId?: string | null },
  resource: { institutionId?: string | null; divisionId?: string | null; campusId?: string | null }
) {
  if (resource.institutionId && assignment.institutionId !== resource.institutionId) return false;
  if (assignment.divisionId && resource.divisionId && assignment.divisionId !== resource.divisionId) return false;
  if (assignment.campusId && resource.campusId && assignment.campusId !== resource.campusId) return false;
  return true;
}
