export const PERMISSIONS = {
  ADMIN_ACCESS: "admin.access",
  USER_MANAGE: "user.manage",
  ORGANIZATION_MANAGE: "organization.manage",
  EMPLOYEE_READ: "employee.read",
  EMPLOYEE_CREATE: "employee.create",
  EMPLOYEE_UPDATE: "employee.update",
  EMPLOYEE_MANAGE: "employee.manage",
  DIRECTOR_ACCESS: "director.access",
  EXECUTIVE_ACCESS: "executive.access",
  ADMISSIONS_ACCESS: "admissions.access",
  ADMISSIONS_MANAGE: "admissions.manage",
  BDM_ACCESS: "bdm.access",
  TELECALLER_ACCESS: "telecaller.access",
  COUNSELLOR_ACCESS: "counsellor.access",
  TRAINER_ACCESS: "trainer.access",
  ADVISOR_READ: "advisor.read",
  ADVISOR_ASSIGN: "advisor.assign",
  ADVISOR_MANAGE: "advisor.manage",
  LABS_READ: "labs.read",
  LABS_CREATE: "labs.create",
  LABS_UPDATE: "labs.update",
  LABS_MANAGE: "labs.manage",
  LABS_ASSIGN: "labs.assign",
  RECRUITMENT_ACCESS: "recruitment.access",
  RECRUITMENT_DIRECTOR: "recruitment.director",
  RELATIONSHIP_MANAGER_ACCESS: "relationship-manager.access",
  STUDENT_ACCESS: "student.access",
  COMMUNITY_ACCESS: "community.access",
  COMMUNITY_MANAGE: "community.manage",
  COMMUNITY_EVENT_MANAGE: "community-event.manage",
  SUCCESS_ACCESS: "success.access",
  SUCCESS_REVIEW: "success.review",
  CERTIFICATE_ISSUE: "certificate.issue",
  AI_STUDENT: "ai.student",
  AI_TRAINER: "ai.trainer",
  AI_ADMISSION: "ai.admission",
  AI_BDM: "ai.bdm",
  AI_DIRECTOR: "ai.director"
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ACCESS_SCOPES = ["GLOBAL", "ORGANIZATION", "DIVISION", "DISTRICT", "BRANCH", "DEPARTMENT", "OWN"] as const;
export type AccessScope = (typeof ACCESS_SCOPES)[number];

export const ROLE_KEYS = {
  STUDENT: "STUDENT",
  TELECALLER: "TELECALLER",
  COUNSELLOR: "COUNSELLOR",
  TRAINER: "TRAINER",
  ACADEMIC_ADVISOR: "ACADEMIC_ADVISOR",
  DIRECTOR: "DIRECTOR",
  CEO: "CEO",
  COO: "COO",
  HOD: "HOD",
  HR_MANAGER: "HR_MANAGER",
  HR_EXECUTIVE: "HR_EXECUTIVE",
  INTERVIEWER: "INTERVIEWER",
  ADMISSION: "ADMISSION",
  BUSINESS_DEVELOPMENT: "BUSINESS_DEVELOPMENT",
  RELATIONSHIP_MANAGER: "RELATIONSHIP_MANAGER",
  ADMIN: "ADMIN"
} as const;

export const ROLE_NAME_TO_KEY: Record<string, string> = {
  Student: ROLE_KEYS.STUDENT,
  Telecaller: ROLE_KEYS.TELECALLER,
  Counsellor: ROLE_KEYS.COUNSELLOR,
  Trainer: ROLE_KEYS.TRAINER,
  "Academic Advisor": ROLE_KEYS.ACADEMIC_ADVISOR,
  Director: ROLE_KEYS.DIRECTOR,
  CEO: ROLE_KEYS.CEO,
  COO: ROLE_KEYS.COO,
  HOD: ROLE_KEYS.HOD,
  "HR Manager": ROLE_KEYS.HR_MANAGER,
  "HR Executive": ROLE_KEYS.HR_EXECUTIVE,
  Interviewer: ROLE_KEYS.INTERVIEWER,
  Admission: ROLE_KEYS.ADMISSION,
  "Business Development": ROLE_KEYS.BUSINESS_DEVELOPMENT,
  "Relationship Manager": ROLE_KEYS.RELATIONSHIP_MANAGER,
  Admin: ROLE_KEYS.ADMIN
};

type LegacyGrant = { permission: PermissionKey; scope: AccessScope };

const allPermissions = Object.values(PERMISSIONS).map((permission) => ({ permission, scope: "GLOBAL" as const }));

export const LEGACY_ROLE_GRANTS: Record<string, LegacyGrant[]> = {
  [ROLE_KEYS.ADMIN]: allPermissions,
  [ROLE_KEYS.DIRECTOR]: allPermissions,
  [ROLE_KEYS.CEO]: [PERMISSIONS.EXECUTIVE_ACCESS, PERMISSIONS.RECRUITMENT_ACCESS, PERMISSIONS.RECRUITMENT_DIRECTOR, PERMISSIONS.EMPLOYEE_READ, PERMISSIONS.AI_DIRECTOR, PERMISSIONS.LABS_READ, PERMISSIONS.LABS_CREATE, PERMISSIONS.LABS_UPDATE, PERMISSIONS.LABS_MANAGE, PERMISSIONS.LABS_ASSIGN].map((permission) => ({ permission, scope: "GLOBAL" })),
  [ROLE_KEYS.COO]: [PERMISSIONS.EXECUTIVE_ACCESS, PERMISSIONS.RECRUITMENT_ACCESS, PERMISSIONS.RECRUITMENT_DIRECTOR, PERMISSIONS.EMPLOYEE_READ, PERMISSIONS.AI_DIRECTOR, PERMISSIONS.LABS_READ, PERMISSIONS.LABS_CREATE, PERMISSIONS.LABS_UPDATE, PERMISSIONS.LABS_MANAGE, PERMISSIONS.LABS_ASSIGN].map((permission) => ({ permission, scope: "GLOBAL" })),
  [ROLE_KEYS.HOD]: [PERMISSIONS.RECRUITMENT_ACCESS, PERMISSIONS.RECRUITMENT_DIRECTOR, PERMISSIONS.EMPLOYEE_READ, PERMISSIONS.LABS_READ, PERMISSIONS.LABS_CREATE, PERMISSIONS.LABS_UPDATE, PERMISSIONS.LABS_ASSIGN].map((permission) => ({ permission, scope: "ORGANIZATION" })),
  [ROLE_KEYS.HR_MANAGER]: [PERMISSIONS.RECRUITMENT_ACCESS, PERMISSIONS.EMPLOYEE_READ, PERMISSIONS.EMPLOYEE_CREATE, PERMISSIONS.EMPLOYEE_UPDATE, PERMISSIONS.EMPLOYEE_MANAGE].map((permission) => ({ permission, scope: "ORGANIZATION" })),
  [ROLE_KEYS.HR_EXECUTIVE]: [PERMISSIONS.RECRUITMENT_ACCESS, PERMISSIONS.EMPLOYEE_READ, PERMISSIONS.EMPLOYEE_CREATE, PERMISSIONS.EMPLOYEE_UPDATE].map((permission) => ({ permission, scope: "ORGANIZATION" })),
  [ROLE_KEYS.INTERVIEWER]: [{ permission: PERMISSIONS.RECRUITMENT_ACCESS, scope: "OWN" }],
  [ROLE_KEYS.ADMISSION]: [PERMISSIONS.ADMISSIONS_ACCESS, PERMISSIONS.ADMISSIONS_MANAGE, PERMISSIONS.TELECALLER_ACCESS, PERMISSIONS.COUNSELLOR_ACCESS, PERMISSIONS.AI_ADMISSION].map((permission) => ({ permission, scope: "ORGANIZATION" })),
  [ROLE_KEYS.BUSINESS_DEVELOPMENT]: [PERMISSIONS.BDM_ACCESS, PERMISSIONS.RELATIONSHIP_MANAGER_ACCESS, PERMISSIONS.AI_BDM].map((permission) => ({ permission, scope: "OWN" })),
  [ROLE_KEYS.RELATIONSHIP_MANAGER]: [PERMISSIONS.BDM_ACCESS, PERMISSIONS.RELATIONSHIP_MANAGER_ACCESS, PERMISSIONS.AI_BDM].map((permission) => ({ permission, scope: "OWN" })),
  [ROLE_KEYS.TELECALLER]: [{ permission: PERMISSIONS.TELECALLER_ACCESS, scope: "OWN" }],
  [ROLE_KEYS.COUNSELLOR]: [{ permission: PERMISSIONS.COUNSELLOR_ACCESS, scope: "OWN" }],
  [ROLE_KEYS.TRAINER]: [PERMISSIONS.TRAINER_ACCESS, PERMISSIONS.COMMUNITY_ACCESS, PERMISSIONS.COMMUNITY_EVENT_MANAGE, PERMISSIONS.SUCCESS_ACCESS, PERMISSIONS.SUCCESS_REVIEW, PERMISSIONS.AI_TRAINER].map((permission) => ({ permission, scope: "OWN" })),
  [ROLE_KEYS.ACADEMIC_ADVISOR]: [PERMISSIONS.ADVISOR_READ, PERMISSIONS.SUCCESS_ACCESS].map((permission) => ({ permission, scope: "OWN" })),
  [ROLE_KEYS.STUDENT]: [PERMISSIONS.STUDENT_ACCESS, PERMISSIONS.COMMUNITY_ACCESS, PERMISSIONS.SUCCESS_ACCESS, PERMISSIONS.AI_STUDENT].map((permission) => ({ permission, scope: "OWN" }))
};

export type AuthorizationUser = {
  id: string;
  roles: Array<{
    role: {
      name: string;
      key?: string | null;
      permissions?: Array<{
        scope: AccessScope;
        permission: { key: string; active: boolean };
      }>;
    };
  }>;
  accessScopes?: Array<{
    scope: AccessScope;
    institutionId?: string | null;
    divisionId?: string | null;
    districtId?: string | null;
    campusId?: string | null;
    departmentId?: string | null;
    expiresAt?: Date | null;
  }>;
  employeeProfile?: {
    id?: string;
    institutionId?: string | null;
    divisionId?: string | null;
    districtId?: string | null;
    campusId?: string | null;
    departmentId?: string | null;
    organizationAssignments?: Array<{
      institutionId: string;
      divisionId?: string | null;
      districtId?: string | null;
      campusId?: string | null;
      departmentId?: string | null;
      startsAt: Date;
      endsAt?: Date | null;
    }>;
  } | null;
};

export type ResourceScope = {
  ownerId?: string | null;
  institutionId?: string | null;
  divisionId?: string | null;
  districtId?: string | null;
  campusId?: string | null;
  departmentId?: string | null;
};

export type EffectiveScopeAssignment = ResourceScope & { scope: Exclude<AccessScope, "GLOBAL" | "OWN"> };

export type AuthorizedScopes = {
  global: boolean;
  own: boolean;
  assignments: EffectiveScopeAssignment[];
};

export function permissionGrants(user: AuthorizationUser, permission: PermissionKey) {
  return user.roles.flatMap(({ role }) => {
    const explicit = role.permissions?.filter((item) => item.permission.active && item.permission.key === permission) ?? [];
    if ((role.permissions?.length ?? 0) > 0) return explicit.map((item) => item.scope);
    const key = role.key ?? ROLE_NAME_TO_KEY[role.name];
    const legacy = (key ? LEGACY_ROLE_GRANTS[key] ?? [] : []).filter((item) => item.permission === permission).map((item) => item.scope);
    if (legacy.length === 0 && key && permission === PERMISSIONS.COMMUNITY_ACCESS) return ["OWN" as const];
    return legacy;
  });
}

export function hasPermission(user: AuthorizationUser, permission: PermissionKey) {
  return permissionGrants(user, permission).length > 0;
}

function scopeMatches(scope: AccessScope, assignment: ResourceScope, resource: ResourceScope, userId: string) {
  if (scope === "GLOBAL") return true;
  if (scope === "OWN") return resource.ownerId === userId;
  if (scope === "ORGANIZATION") return Boolean(assignment.institutionId && assignment.institutionId === resource.institutionId);
  if (scope === "DIVISION") return Boolean(assignment.divisionId && assignment.divisionId === resource.divisionId);
  if (scope === "DISTRICT") return Boolean(assignment.districtId && assignment.districtId === resource.districtId);
  if (scope === "BRANCH") return Boolean(assignment.campusId && assignment.campusId === resource.campusId);
  if (scope === "DEPARTMENT") return Boolean(assignment.departmentId && assignment.departmentId === resource.departmentId);
  return false;
}

export function resolveAuthorizedScopes(user: AuthorizationUser, permission: PermissionKey, now = new Date()): AuthorizedScopes {
  const grants = permissionGrants(user, permission);
  const own = grants.includes("OWN");
  const hasScopedGrant = grants.some((grant) => grant !== "OWN");
  if (!hasScopedGrant) return { global: false, own, assignments: [] };

  const explicitScopes = (user.accessScopes ?? [])
    .filter((item) => item.scope !== "GLOBAL" && item.scope !== "OWN" && (!item.expiresAt || item.expiresAt > now))
    .map((item) => ({ ...item, scope: item.scope as EffectiveScopeAssignment["scope"] }));
  if (explicitScopes.length > 0) return { global: false, own, assignments: explicitScopes };
  if (grants.includes("GLOBAL")) return { global: true, own, assignments: [] };

  const profile = user.employeeProfile;
  const assignments: EffectiveScopeAssignment[] = [];
  if (profile) {
    const profiles = [
      profile,
      ...(profile.organizationAssignments ?? []).filter((assignment) => assignment.startsAt <= now && (!assignment.endsAt || assignment.endsAt > now))
    ];
    for (const assignment of profiles) {
      if (grants.includes("ORGANIZATION") && assignment.institutionId) assignments.push({ scope: "ORGANIZATION", ...assignment });
      if (grants.includes("DIVISION") && assignment.divisionId) assignments.push({ scope: "DIVISION", ...assignment });
      if (grants.includes("DISTRICT") && assignment.districtId) assignments.push({ scope: "DISTRICT", ...assignment });
      if (grants.includes("BRANCH") && assignment.campusId) assignments.push({ scope: "BRANCH", ...assignment });
      if (grants.includes("DEPARTMENT") && assignment.departmentId) assignments.push({ scope: "DEPARTMENT", ...assignment });
    }
  }
  return { global: false, own, assignments };
}

export function canAccessResource(user: AuthorizationUser, permission: PermissionKey, resource: ResourceScope, now = new Date()) {
  const resolved = resolveAuthorizedScopes(user, permission, now);
  if (resolved.global) return true;
  if (resolved.own && resource.ownerId === user.id) return true;
  return resolved.assignments.some((assignment) => scopeMatches(assignment.scope, assignment, resource, user.id));
}
