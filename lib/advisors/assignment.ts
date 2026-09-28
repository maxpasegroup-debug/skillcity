export type AdvisorAssignmentWindow = {
  status: "ACTIVE" | "INACTIVE";
  startsAt: Date;
  endsAt?: Date | null;
};

export type AdvisorAssignmentTarget = {
  studentId?: string | null;
  batchId?: string | null;
};

export function isEffectiveAdvisorAssignment(assignment: AdvisorAssignmentWindow, now = new Date()) {
  return assignment.status === "ACTIVE" && assignment.startsAt <= now && (!assignment.endsAt || assignment.endsAt > now);
}

export function hasExactlyOneAdvisorTarget(target: AdvisorAssignmentTarget) {
  return Number(Boolean(target.studentId)) + Number(Boolean(target.batchId)) === 1;
}

export function assignmentWindowsOverlap(
  left: Pick<AdvisorAssignmentWindow, "startsAt" | "endsAt">,
  right: Pick<AdvisorAssignmentWindow, "startsAt" | "endsAt">
) {
  const leftEnd = left.endsAt?.getTime() ?? Number.POSITIVE_INFINITY;
  const rightEnd = right.endsAt?.getTime() ?? Number.POSITIVE_INFINITY;
  return left.startsAt.getTime() < rightEnd && right.startsAt.getTime() < leftEnd;
}

export function resolveAdvisorAssignmentSource(input: {
  directAdvisorIds: string[];
  batchAdvisorIds: string[];
  advisorId: string;
}) {
  if (input.directAdvisorIds.length > 0) return input.directAdvisorIds.includes(input.advisorId) ? "STUDENT" : null;
  return input.batchAdvisorIds.includes(input.advisorId) ? "BATCH" : null;
}
