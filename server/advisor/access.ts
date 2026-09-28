import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission, type AuthorizationUser } from "@/lib/auth/permissions";
import { AuthorizationError } from "@/server/auth/authorization";

export function effectiveAdvisorAssignmentWhere(now = new Date()): Prisma.AcademicAdvisorAssignmentWhereInput {
  return {
    status: "ACTIVE",
    startsAt: { lte: now },
    OR: [{ endsAt: null }, { endsAt: { gt: now } }]
  };
}

export function advisorStudentAccessWhere(advisorId: string, now = new Date()): Prisma.UserWhereInput {
  const effective = effectiveAdvisorAssignmentWhere(now);
  return {
    OR: [
      { academicAdvisorAssignments: { some: { ...effective, advisorId } } },
      {
        AND: [
          {
            enrollments: {
              some: {
                status: "ACTIVE",
                batch: { academicAdvisorAssignments: { some: { ...effective, advisorId } } }
              }
            }
          },
          { academicAdvisorAssignments: { none: effective } }
        ]
      }
    ]
  };
}

export async function assertAdvisorStudentAccess(actor: AuthorizationUser, studentId: string) {
  if (!hasPermission(actor, PERMISSIONS.ADVISOR_READ)) throw new AuthorizationError();
  const advisorId = actor.employeeProfile && "id" in actor.employeeProfile ? actor.employeeProfile.id : undefined;
  if (!advisorId) throw new AuthorizationError("Academic advisor access requires an Employee profile");
  const student = await prisma.user.findFirst({
    where: { id: studentId, deletedAt: null, ...advisorStudentAccessWhere(advisorId) },
    select: { id: true }
  });
  if (!student) throw new AuthorizationError("Student is not assigned to this academic advisor");
  return student;
}

export async function getEffectiveStudentAdvisor(studentId: string, batchId?: string | null, now = new Date()) {
  const effective = effectiveAdvisorAssignmentWhere(now);
  const direct = await prisma.academicAdvisorAssignment.findFirst({
    where: { ...effective, studentId },
    orderBy: { startsAt: "desc" },
    include: { advisor: { include: { user: true, designation: true } } }
  });
  if (direct || !batchId) return direct ? { assignment: direct, source: "STUDENT" as const } : null;
  const inherited = await prisma.academicAdvisorAssignment.findFirst({
    where: { ...effective, batchId },
    orderBy: { startsAt: "desc" },
    include: { advisor: { include: { user: true, designation: true } } }
  });
  return inherited ? { assignment: inherited, source: "BATCH" as const } : null;
}
