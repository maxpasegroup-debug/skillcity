import { prisma } from "@/lib/prisma";
import { PERMISSIONS, type AuthorizationUser } from "@/lib/auth/permissions";
import { organizationConflict } from "@/lib/crm/validation";
import { AuthorizationError } from "@/server/auth/authorization";
import { assertEmployeeAccess } from "@/server/auth/resource-access";

export async function assertAssignableEmployee(actor: AuthorizationUser, userId: string) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
      status: "ACTIVE",
      employeeProfile: { status: { in: ["ACTIVE", "PROBATION", "ON_NOTICE"] } }
    },
    select: { id: true, employeeProfile: { select: { id: true } } }
  });
  if (!user?.employeeProfile) throw new AuthorizationError("Assignee must be an active employee");
  await assertEmployeeAccess(actor, PERMISSIONS.ADMISSIONS_MANAGE, user.employeeProfile.id);
  return user;
}

export async function assertLeadProgramRelationship(leadId: string, programId: string) {
  const [lead, program] = await Promise.all([
    prisma.lead.findUnique({ where: { id: leadId }, select: { institutionId: true, divisionId: true, campusId: true } }),
    prisma.program.findUnique({ where: { id: programId }, select: { institutionId: true, divisionId: true, campusId: true } })
  ]);
  if (!lead || !program) throw new AuthorizationError("Lead or program was not found");
  const conflict = organizationConflict(lead, program);
  if (conflict) throw new AuthorizationError(`Lead and program have conflicting ${conflict.replace("Id", "")} scope`);
}
