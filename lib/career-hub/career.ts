export const CAREER_OPPORTUNITY_TYPES = ["EMPLOYMENT", "FREELANCE", "CONTRACT", "INTERNSHIP", "APPRENTICESHIP", "PROJECT", "SELF_EMPLOYMENT"] as const;
export const CAREER_WORK_MODES = ["ONSITE", "REMOTE", "HYBRID", "FLEXIBLE"] as const;
export const CAREER_OPPORTUNITY_STATUSES = ["DRAFT", "OPEN", "PAUSED", "CLOSED", "ARCHIVED"] as const;
export const CAREER_OPPORTUNITY_VISIBILITIES = ["INTERNAL", "AUTHENTICATED", "PUBLIC"] as const;
export const CAREER_APPLICATION_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "REJECTED", "WITHDRAWN", "SELECTED"] as const;

export function normalizeOpportunityCode(value: string) {
  return value.trim().toLowerCase();
}

export function splitCareerList(value?: string) {
  return value?.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 30) ?? [];
}

export function assignmentCoversCareerResource(
  assignment: { institutionId?: string | null; divisionId?: string | null; districtId?: string | null; campusId?: string | null; departmentId?: string | null },
  resource: { institutionId: string; divisionId?: string | null; districtId?: string | null; campusId?: string | null; departmentId?: string | null }
) {
  if (assignment.institutionId !== resource.institutionId) return false;
  if (assignment.divisionId && resource.divisionId && assignment.divisionId !== resource.divisionId) return false;
  if (assignment.districtId && resource.districtId && assignment.districtId !== resource.districtId) return false;
  if (assignment.campusId && resource.campusId && assignment.campusId !== resource.campusId) return false;
  if (assignment.departmentId && resource.departmentId && assignment.departmentId !== resource.departmentId) return false;
  return true;
}

const applicationTransitions: Record<string, string[]> = {
  SUBMITTED: ["UNDER_REVIEW", "SHORTLISTED", "REJECTED", "SELECTED"],
  UNDER_REVIEW: ["SHORTLISTED", "REJECTED", "SELECTED"],
  SHORTLISTED: ["REJECTED", "SELECTED"],
  REJECTED: [],
  WITHDRAWN: [],
  SELECTED: []
};

export function canTransitionCareerApplication(from: string, to: string) {
  return from === to || (applicationTransitions[from] ?? []).includes(to);
}

export function opportunityAcceptsApplications(input: {
  status: string;
  visibility: string;
  applicationDeadline?: Date | null;
  capacity?: number | null;
  activeApplications: number;
}, now = new Date()) {
  if (input.status !== "OPEN") return false;
  if (input.visibility === "INTERNAL") return false;
  if (input.applicationDeadline && input.applicationDeadline < now) return false;
  if (input.capacity != null && input.activeApplications >= input.capacity) return false;
  return true;
}
