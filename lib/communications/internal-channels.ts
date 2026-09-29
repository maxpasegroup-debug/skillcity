import type { InternalChannelMemberRole, InternalChannelType, Prisma } from "@prisma/client";
import type { ResourceScope } from "@/lib/auth/permissions";
import type { AuthorizationUser } from "@/lib/auth/permissions";

export const INTERNAL_CHANNEL_TYPES = ["TEAM", "ANNOUNCEMENT"] as const satisfies readonly InternalChannelType[];

export function uniqueChannelMemberIds(memberIds: readonly string[], actorId: string) {
  return [...new Set(memberIds.filter((id) => id !== actorId))];
}

export function canPostInternalMessage(type: InternalChannelType, role: InternalChannelMemberRole) {
  return type === "TEAM" || role === "OWNER" || role === "MODERATOR";
}

export function isActiveInternalCommunicationEmployee(user: AuthorizationUser) {
  return Boolean(user.employeeProfile?.status && ["ACTIVE", "PROBATION", "ON_NOTICE"].includes(user.employeeProfile.status));
}

export type InternalChannelScope = ResourceScope & { institutionId: string };

export function employeeChannelCompatibilityWhere(path: InternalChannelScope, now = new Date()): Prisma.EmployeeWhereInput {
  const direct = {
    institutionId: path.institutionId,
    ...(path.divisionId ? { divisionId: path.divisionId } : {}),
    ...(path.districtId ? { districtId: path.districtId } : {}),
    ...(path.campusId ? { campusId: path.campusId } : {}),
    ...(path.departmentId ? { departmentId: path.departmentId } : {})
  };
  const assignment = {
    ...direct,
    startsAt: { lte: now },
    OR: [{ endsAt: null }, { endsAt: { gt: now } }]
  };
  return { OR: [direct, { organizationAssignments: { some: assignment } }] };
}
