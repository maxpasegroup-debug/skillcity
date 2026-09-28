import type { Prisma } from "@prisma/client";
import { resolveAuthorizedScopes, type AuthorizationUser, type EffectiveScopeAssignment, type PermissionKey } from "@/lib/auth/permissions";

function programCondition(scope: EffectiveScopeAssignment): Prisma.ProgramWhereInput | null {
  if (scope.scope === "ORGANIZATION" && scope.institutionId) {
    return { OR: [{ institutionId: scope.institutionId }, { division: { institutionId: scope.institutionId } }, { campus: { institutionId: scope.institutionId } }, { department: { institutionId: scope.institutionId } }] };
  }
  if (scope.scope === "DIVISION" && scope.divisionId) return { divisionId: scope.divisionId };
  if (scope.scope === "DISTRICT" && scope.districtId) return { campus: { districtId: scope.districtId } };
  if (scope.scope === "BRANCH" && scope.campusId) return { campusId: scope.campusId };
  if (scope.scope === "DEPARTMENT" && scope.departmentId) return { departmentId: scope.departmentId };
  return null;
}

function leadCondition(scope: EffectiveScopeAssignment): Prisma.LeadWhereInput | null {
  if (scope.scope === "ORGANIZATION" && scope.institutionId) {
    return { OR: [{ institutionId: scope.institutionId }, { division: { institutionId: scope.institutionId } }, { district: { institutionId: scope.institutionId } }, { campus: { institutionId: scope.institutionId } }] };
  }
  if (scope.scope === "DIVISION" && scope.divisionId) return { divisionId: scope.divisionId };
  if (scope.scope === "DISTRICT" && scope.districtId) return { OR: [{ districtId: scope.districtId }, { campus: { districtId: scope.districtId } }] };
  if (scope.scope === "BRANCH" && scope.campusId) return { campusId: scope.campusId };
  return null;
}

function batchCondition(scope: EffectiveScopeAssignment): Prisma.BatchWhereInput | null {
  const program = programCondition(scope);
  if (scope.scope === "DIVISION" || scope.scope === "DEPARTMENT") return program ? { program } : null;
  if (scope.scope === "ORGANIZATION" && scope.institutionId) {
    return { OR: [{ campusId: { not: null }, campus: { institutionId: scope.institutionId } }, { campusId: null, program: program ?? undefined }] };
  }
  if (scope.scope === "DISTRICT" && scope.districtId) {
    return { OR: [{ campusId: { not: null }, campus: { districtId: scope.districtId } }, { campusId: null, program: program ?? undefined }] };
  }
  if (scope.scope === "BRANCH" && scope.campusId) {
    return { OR: [{ campusId: scope.campusId }, { campusId: null, program: program ?? undefined }] };
  }
  return null;
}

function scopedWhere<T>(user: AuthorizationUser, permission: PermissionKey, own: T | null, conditions: Array<T | null>): T {
  const resolved = resolveAuthorizedScopes(user, permission);
  if (resolved.global) return {} as T;
  const allowed = conditions.filter((item): item is T => Boolean(item));
  if (resolved.own && own) allowed.push(own);
  return { OR: allowed.length > 0 ? allowed : [{ id: { equals: "00000000-0000-0000-0000-000000000000" } }] } as T;
}

export function programScopeWhere(user: AuthorizationUser, permission: PermissionKey): Prisma.ProgramWhereInput {
  const scopes = resolveAuthorizedScopes(user, permission);
  return scopedWhere<Prisma.ProgramWhereInput>(user, permission, null, scopes.assignments.map(programCondition));
}

export function leadScopeWhere(user: AuthorizationUser, permission: PermissionKey): Prisma.LeadWhereInput {
  const scopes = resolveAuthorizedScopes(user, permission);
  return scopedWhere<Prisma.LeadWhereInput>(user, permission, { OR: [{ assignedToId: user.id }, { ownerId: user.id }] }, scopes.assignments.map(leadCondition));
}

export function batchScopeWhere(user: AuthorizationUser, permission: PermissionKey): Prisma.BatchWhereInput {
  const scopes = resolveAuthorizedScopes(user, permission);
  return scopedWhere<Prisma.BatchWhereInput>(user, permission, null, scopes.assignments.map(batchCondition));
}

export function skillStudioProgramScopeWhere(user: AuthorizationUser, permission: PermissionKey): Prisma.ProgramWhereInput {
  const resolved = resolveAuthorizedScopes(user, permission);
  const organizationScope = programScopeWhere(user, permission);
  const own: Prisma.ProgramWhereInput = {
    OR: [
      { enrollments: { some: { studentId: user.id } } },
      { batches: { some: { trainerAssignments: { some: { trainerId: user.id, status: "ACTIVE" } } } } }
    ]
  };
  return {
    AND: [
      { operatingDomain: "SKILL_STUDIO", deletedAt: null },
      resolved.global ? {} : resolved.own ? { OR: [organizationScope, own] } : organizationScope
    ]
  };
}

export function skillStudioBatchScopeWhere(user: AuthorizationUser, permission: PermissionKey): Prisma.BatchWhereInput {
  const resolved = resolveAuthorizedScopes(user, permission);
  const organizationScope = batchScopeWhere(user, permission);
  const own: Prisma.BatchWhereInput = {
    OR: [
      { enrollments: { some: { studentId: user.id } } },
      { trainerAssignments: { some: { trainerId: user.id, status: "ACTIVE" } } }
    ]
  };
  return {
    AND: [
      { program: { operatingDomain: "SKILL_STUDIO", deletedAt: null } },
      resolved.global ? {} : resolved.own ? { OR: [organizationScope, own] } : organizationScope
    ]
  };
}

export function labsProductScopeWhere(user: AuthorizationUser, permission: PermissionKey): Prisma.LabsProductWhereInput {
  const scopes = resolveAuthorizedScopes(user, permission);
  const now = new Date();
  const conditions = scopes.assignments.map((scope): Prisma.LabsProductWhereInput | null => {
    if (scope.scope === "ORGANIZATION" && scope.institutionId) return { institutionId: scope.institutionId };
    if (scope.scope === "DIVISION" && scope.divisionId) return { divisionId: scope.divisionId };
    if (scope.scope === "DISTRICT" && scope.districtId) return { districtId: scope.districtId };
    if (scope.scope === "BRANCH" && scope.campusId) return { campusId: scope.campusId };
    if (scope.scope === "DEPARTMENT" && scope.departmentId) return { departmentId: scope.departmentId };
    return null;
  });
  return scopedWhere<Prisma.LabsProductWhereInput>(user, permission, {
    assignments: {
      some: {
        employee: { userId: user.id },
        status: "ACTIVE",
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gt: now } }]
      }
    }
  }, conditions);
}

export function activityScopeWhere(user: AuthorizationUser, permission: PermissionKey): Prisma.ActivityWhereInput {
  const batch = batchScopeWhere(user, permission);
  const program = programScopeWhere(user, permission);
  const resolved = resolveAuthorizedScopes(user, permission);
  if (resolved.global) return {};
  return { OR: [{ batchId: { not: null }, batch }, { batchId: null, day: { week: { phase: { journey: { program } } } } }] };
}

export function calendarEventScopeWhere(user: AuthorizationUser, permission: PermissionKey): Prisma.CalendarEventWhereInput {
  const batch = batchScopeWhere(user, permission);
  const program = programScopeWhere(user, permission);
  const resolved = resolveAuthorizedScopes(user, permission);
  if (resolved.global) return {};
  return {
    OR: [
      { batchId: { not: null }, batch },
      { batchId: null, programId: { not: null }, program },
      { batchId: null, programId: null, journey: { program } }
    ]
  };
}

export function userThroughEnrollmentScopeWhere(user: AuthorizationUser, permission: PermissionKey): Prisma.UserWhereInput {
  const resolved = resolveAuthorizedScopes(user, permission);
  if (resolved.global) return {};
  return { OR: [{ id: user.id }, { enrollments: { some: enrollmentScopeWhere(user, permission) } }] };
}

const unscopedLead: Prisma.LeadWhereInput = { institutionId: null, divisionId: null, districtId: null, campusId: null };

export function applicationScopeWhere(user: AuthorizationUser, permission: PermissionKey): Prisma.AdmissionApplicationWhereInput {
  const scopes = resolveAuthorizedScopes(user, permission);
  const conditions = scopes.assignments.map((scope) => {
    const lead = leadCondition(scope);
    const program = programCondition(scope);
    return lead && program ? { OR: [{ lead }, { lead: unscopedLead, program }] } : lead ? { lead } : program ? { lead: unscopedLead, program } : null;
  });
  return scopedWhere<Prisma.AdmissionApplicationWhereInput>(user, permission, { OR: [{ lead: { assignedToId: user.id } }, { lead: { ownerId: user.id } }, { studentId: user.id }] }, conditions);
}

export function enrollmentScopeWhere(user: AuthorizationUser, permission: PermissionKey): Prisma.StudentEnrollmentWhereInput {
  const scopes = resolveAuthorizedScopes(user, permission);
  const conditions = scopes.assignments.map((scope) => {
    const batch = batchCondition(scope);
    const program = programCondition(scope);
    return batch && program ? { OR: [{ batchId: { not: null }, batch }, { batchId: null, program }] } : null;
  });
  return scopedWhere<Prisma.StudentEnrollmentWhereInput>(user, permission, { studentId: user.id }, conditions);
}

export function enrollmentLogScopeWhere(user: AuthorizationUser, permission: PermissionKey): Prisma.EnrollmentLogWhereInput {
  const enrollment = enrollmentScopeWhere(user, permission);
  const batch = batchScopeWhere(user, permission);
  return scopedWhere<Prisma.EnrollmentLogWhereInput>(user, permission, { studentId: user.id }, [
    { enrollmentId: { not: null }, enrollment },
    { enrollmentId: null, batchId: { not: null }, batch },
    { enrollmentId: null, batchId: null, student: { enrollments: { some: enrollment } } }
  ]);
}

export function studentConcernScopeWhere(user: AuthorizationUser, permission: PermissionKey): Prisma.StudentConcernWhereInput {
  const enrollment = enrollmentScopeWhere(user, permission);
  const batch = batchScopeWhere(user, permission);
  return scopedWhere<Prisma.StudentConcernWhereInput>(user, permission, { studentId: user.id }, [
    { batchId: { not: null }, batch },
    { batchId: null, student: { enrollments: { some: enrollment } } }
  ]);
}

export function documentScopeWhere(user: AuthorizationUser, permission: PermissionKey): Prisma.StudentDocumentWhereInput {
  const application = applicationScopeWhere(user, permission);
  const enrollment = enrollmentScopeWhere(user, permission);
  return scopedWhere<Prisma.StudentDocumentWhereInput>(user, permission, { studentId: user.id }, [
    { applicationId: { not: null }, application },
    { applicationId: null, student: { enrollments: { some: enrollment } } }
  ]);
}

export function feeInvoiceScopeWhere(user: AuthorizationUser, permission: PermissionKey): Prisma.FeeInvoiceWhereInput {
  const lead = leadScopeWhere(user, permission);
  const batch = batchScopeWhere(user, permission);
  const program = programScopeWhere(user, permission);
  const enrollment = enrollmentScopeWhere(user, permission);
  return scopedWhere<Prisma.FeeInvoiceWhereInput>(user, permission, { OR: [{ lead: { assignedToId: user.id } }, { lead: { ownerId: user.id } }, { studentId: user.id }] }, [
    { leadId: { not: null }, lead },
    { leadId: null, batchId: { not: null }, batch },
    { leadId: null, batchId: null, programId: { not: null }, program },
    { leadId: null, batchId: null, programId: null, student: { enrollments: { some: enrollment } } }
  ]);
}

export function employeeScopeWhere(user: AuthorizationUser, permission: PermissionKey): Prisma.EmployeeWhereInput {
  const scopes = resolveAuthorizedScopes(user, permission);
  const now = new Date();
  const conditions = scopes.assignments.map((scope): Prisma.EmployeeWhereInput | null => {
    const activeAssignment = { startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] };
    if (scope.scope === "ORGANIZATION" && scope.institutionId) return { OR: [{ institutionId: scope.institutionId }, { organizationAssignments: { some: { institutionId: scope.institutionId, ...activeAssignment } } }] };
    if (scope.scope === "DIVISION" && scope.divisionId) return { OR: [{ divisionId: scope.divisionId }, { organizationAssignments: { some: { divisionId: scope.divisionId, ...activeAssignment } } }] };
    if (scope.scope === "DISTRICT" && scope.districtId) return { OR: [{ districtId: scope.districtId }, { organizationAssignments: { some: { districtId: scope.districtId, ...activeAssignment } } }] };
    if (scope.scope === "BRANCH" && scope.campusId) return { OR: [{ campusId: scope.campusId }, { organizationAssignments: { some: { campusId: scope.campusId, ...activeAssignment } } }] };
    if (scope.scope === "DEPARTMENT" && scope.departmentId) return { OR: [{ departmentId: scope.departmentId }, { organizationAssignments: { some: { departmentId: scope.departmentId, ...activeAssignment } } }] };
    return null;
  });
  return scopedWhere<Prisma.EmployeeWhereInput>(user, permission, { userId: user.id }, conditions);
}

export function careerApplicationScopeWhere(user: AuthorizationUser, permission: PermissionKey): Prisma.CareerApplicationWhereInput {
  const scopes = resolveAuthorizedScopes(user, permission);
  const conditions = scopes.assignments.map((scope): Prisma.CareerApplicationWhereInput | null => {
    if (scope.scope === "ORGANIZATION" && scope.institutionId) return { institutionId: scope.institutionId };
    if (scope.scope === "DIVISION" && scope.divisionId) return { divisionId: scope.divisionId };
    if (scope.scope === "DISTRICT" && scope.districtId) return { districtScopeId: scope.districtId };
    if (scope.scope === "BRANCH" && scope.campusId) return { campusId: scope.campusId };
    return null;
  });
  return scopedWhere<Prisma.CareerApplicationWhereInput>(user, permission, { OR: [{ assignedHrId: user.id }, { reviewedById: user.id }, { interviews: { some: { interviewerId: user.id } } }] }, conditions);
}

export function institutionScopeWhere(user: AuthorizationUser, permission: PermissionKey): Prisma.InstitutionWhereInput {
  const resolved = resolveAuthorizedScopes(user, permission);
  if (resolved.global) return {};
  const conditions = resolved.assignments.flatMap((scope): Prisma.InstitutionWhereInput[] => {
    if (scope.institutionId) return [{ id: scope.institutionId }];
    if (scope.divisionId) return [{ divisions: { some: { id: scope.divisionId } } }];
    if (scope.districtId) return [{ districts: { some: { id: scope.districtId } } }];
    if (scope.campusId) return [{ campuses: { some: { id: scope.campusId } } }];
    if (scope.departmentId) return [{ departments: { some: { id: scope.departmentId } } }];
    return [];
  });
  return { OR: conditions.length ? conditions : [{ id: "00000000-0000-0000-0000-000000000000" }] };
}

export function divisionScopeWhere(user: AuthorizationUser, permission: PermissionKey): Prisma.DivisionWhereInput {
  const resolved = resolveAuthorizedScopes(user, permission);
  if (resolved.global) return {};
  const conditions = resolved.assignments.flatMap((scope): Prisma.DivisionWhereInput[] => {
    if (scope.scope === "ORGANIZATION" && scope.institutionId) return [{ institutionId: scope.institutionId }];
    if (scope.divisionId) return [{ id: scope.divisionId }];
    if (scope.departmentId) return [{ departments: { some: { id: scope.departmentId } } }];
    if (scope.campusId) return [{ programs: { some: { campusId: scope.campusId } } }];
    return [];
  });
  return { OR: conditions.length ? conditions : [{ id: "00000000-0000-0000-0000-000000000000" }] };
}

export function districtScopeWhere(user: AuthorizationUser, permission: PermissionKey): Prisma.DistrictWhereInput {
  const resolved = resolveAuthorizedScopes(user, permission);
  if (resolved.global) return {};
  const conditions = resolved.assignments.flatMap((scope): Prisma.DistrictWhereInput[] => {
    if (scope.scope === "ORGANIZATION" && scope.institutionId) return [{ institutionId: scope.institutionId }];
    if (scope.districtId) return [{ id: scope.districtId }];
    if (scope.campusId) return [{ campuses: { some: { id: scope.campusId } } }];
    return [];
  });
  return { OR: conditions.length ? conditions : [{ id: "00000000-0000-0000-0000-000000000000" }] };
}

export function campusScopeWhere(user: AuthorizationUser, permission: PermissionKey): Prisma.CampusWhereInput {
  const resolved = resolveAuthorizedScopes(user, permission);
  if (resolved.global) return {};
  const conditions = resolved.assignments.flatMap((scope): Prisma.CampusWhereInput[] => {
    if (scope.scope === "ORGANIZATION" && scope.institutionId) return [{ institutionId: scope.institutionId }];
    if (scope.divisionId) return [{ programs: { some: { divisionId: scope.divisionId } } }];
    if (scope.districtId) return [{ districtId: scope.districtId }];
    if (scope.campusId) return [{ id: scope.campusId }];
    if (scope.departmentId) return [{ departments: { some: { id: scope.departmentId } } }];
    return [];
  });
  return { OR: conditions.length ? conditions : [{ id: "00000000-0000-0000-0000-000000000000" }] };
}

export function departmentScopeWhere(user: AuthorizationUser, permission: PermissionKey): Prisma.DepartmentWhereInput {
  const resolved = resolveAuthorizedScopes(user, permission);
  if (resolved.global) return {};
  const conditions = resolved.assignments.flatMap((scope): Prisma.DepartmentWhereInput[] => {
    if (scope.scope === "ORGANIZATION" && scope.institutionId) return [{ institutionId: scope.institutionId }];
    if (scope.divisionId) return [{ divisionId: scope.divisionId }];
    if (scope.districtId) return [{ campus: { districtId: scope.districtId } }];
    if (scope.campusId) return [{ campusId: scope.campusId }];
    if (scope.departmentId) return [{ id: scope.departmentId }];
    return [];
  });
  return { OR: conditions.length ? conditions : [{ id: "00000000-0000-0000-0000-000000000000" }] };
}
