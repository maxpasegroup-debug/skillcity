export const LABS_PRODUCT_TYPES = ["PLATFORM", "APPLICATION", "AI_PRODUCT", "INTERNAL_TOOL", "AUTOMATION", "SERVICE"] as const;
export const LABS_PRODUCT_LIFECYCLES = ["IDEA", "PLANNING", "BUILDING", "PILOT", "LIVE", "MAINTENANCE", "ARCHIVED"] as const;

export function normalizeLabsProductCode(value: string) {
  return value.trim().toLowerCase();
}

export function isEffectiveLabsAssignment(input: { status: string; startsAt: Date; endsAt?: Date | null }, now = new Date()) {
  return input.status === "ACTIVE" && input.startsAt <= now && (!input.endsAt || input.endsAt > now);
}

export function assignmentCoversLabsProduct(
  assignment: { institutionId?: string | null; divisionId?: string | null; districtId?: string | null; campusId?: string | null; departmentId?: string | null },
  product: { institutionId: string; divisionId: string; districtId?: string | null; campusId?: string | null; departmentId?: string | null }
) {
  if (assignment.institutionId !== product.institutionId) return false;
  if (assignment.divisionId && assignment.divisionId !== product.divisionId) return false;
  if (assignment.districtId && assignment.districtId !== product.districtId) return false;
  if (assignment.campusId && assignment.campusId !== product.campusId) return false;
  if (assignment.departmentId && assignment.departmentId !== product.departmentId) return false;
  return true;
}

export function assignmentWindowsOverlap(left: { startsAt: Date; endsAt?: Date | null }, right: { startsAt: Date; endsAt?: Date | null }) {
  const leftEnd = left.endsAt?.getTime() ?? Number.POSITIVE_INFINITY;
  const rightEnd = right.endsAt?.getTime() ?? Number.POSITIVE_INFINITY;
  return left.startsAt.getTime() < rightEnd && right.startsAt.getTime() < leftEnd;
}
