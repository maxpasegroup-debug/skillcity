export type OrganizationPath = {
  institutionId: string;
  divisionId?: string | null;
  districtId?: string | null;
  campusId?: string | null;
  departmentId?: string | null;
};

export type OrganizationReferenceSet = {
  division?: { id: string; institutionId: string } | null;
  district?: { id: string; institutionId: string } | null;
  campus?: { id: string; institutionId: string; districtId?: string | null } | null;
  department?: { id: string; institutionId?: string | null; divisionId?: string | null; campusId?: string | null } | null;
};

export type EmployeeOrganizationProfile = OrganizationPath & {
  employeeId: string;
  userId: string;
  assignments?: Array<OrganizationPath & { id: string; startsAt: Date; endsAt?: Date | null }>;
};

export function validateOrganizationPath(path: OrganizationPath, references: OrganizationReferenceSet) {
  const issues: string[] = [];
  const units = [references.division, references.district, references.campus, references.department].filter(Boolean);

  if (units.some((unit) => unit?.institutionId && unit.institutionId !== path.institutionId)) {
    issues.push("All organization units must belong to the selected organization.");
  }
  if (path.divisionId && references.department?.divisionId && references.department.divisionId !== path.divisionId) {
    issues.push("The department does not belong to the selected division.");
  }
  if (path.campusId && references.department?.campusId && references.department.campusId !== path.campusId) {
    issues.push("The department does not belong to the selected branch or centre.");
  }
  if (path.districtId && references.campus?.districtId && references.campus.districtId !== path.districtId) {
    issues.push("The branch or centre does not belong to the selected district.");
  }

  return { valid: issues.length === 0, issues };
}

export function resolveEmployeeOrganizationScopes(profile: EmployeeOrganizationProfile, now = new Date()) {
  const primary: OrganizationPath & { source: "PRIMARY"; assignmentId: null } = {
    source: "PRIMARY",
    assignmentId: null,
    institutionId: profile.institutionId,
    divisionId: profile.divisionId,
    districtId: profile.districtId,
    campusId: profile.campusId,
    departmentId: profile.departmentId
  };
  const additional = (profile.assignments ?? [])
    .filter((assignment) => assignment.startsAt <= now && (!assignment.endsAt || assignment.endsAt > now))
    .map((assignment) => ({
      source: "ADDITIONAL" as const,
      assignmentId: assignment.id,
      institutionId: assignment.institutionId,
      divisionId: assignment.divisionId,
      districtId: assignment.districtId,
      campusId: assignment.campusId,
      departmentId: assignment.departmentId
    }));

  return [primary, ...additional];
}
