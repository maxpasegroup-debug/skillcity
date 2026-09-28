"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, type AuthorizationUser } from "@/lib/auth/permissions";
import { assignmentCoversAcademicResource } from "@/lib/academic/validation";
import { advisorAssignmentSchema, endAdvisorAssignmentSchema } from "@/features/advisors/schemas";
import { assertPermission, AuthorizationError } from "@/server/auth/authorization";
import { assertBatchAccess, assertEmployeeAccess, assertStudentAccess } from "@/server/auth/resource-access";
import { employeeScopeWhere } from "@/server/auth/scoping";

export type AdvisorActionState = { ok: boolean; message: string };

type AcademicResource = { institutionId?: string | null; divisionId?: string | null; campusId?: string | null };

function failure(message: string): AdvisorActionState {
  return { ok: false, message };
}

async function getEligibleAdvisor(actor: AuthorizationUser, advisorId: string) {
  await assertEmployeeAccess(actor, PERMISSIONS.ADVISOR_ASSIGN, advisorId);
  const now = new Date();
  const advisor = await prisma.employee.findFirst({
    where: {
      id: advisorId,
      AND: [employeeScopeWhere(actor, PERMISSIONS.ADVISOR_ASSIGN), { status: { in: ["ACTIVE", "PROBATION", "ON_NOTICE"] } }],
      user: {
        status: "ACTIVE",
        deletedAt: null,
        OR: [
          { roles: { some: { role: { key: "ACADEMIC_ADVISOR" } } } },
          { roles: { some: { role: { name: "Academic Advisor" } } } }
        ]
      }
    },
    include: {
      user: true,
      organizationAssignments: {
        where: { startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] }
      }
    }
  });
  if (!advisor) throw new AuthorizationError("Advisor must be an active, authorized Employee with the Academic Advisor role");
  return advisor;
}

function advisorCoversResource(advisor: Awaited<ReturnType<typeof getEligibleAdvisor>>, resource: AcademicResource) {
  return [advisor, ...advisor.organizationAssignments].some((assignment) => assignmentCoversAcademicResource(assignment, resource));
}

async function getTargetResource(actor: AuthorizationUser, target: { studentId?: string; batchId?: string }) {
  if (target.batchId) {
    await assertBatchAccess(actor, PERMISSIONS.ADVISOR_ASSIGN, target.batchId);
    const batch = await prisma.batch.findUnique({ where: { id: target.batchId }, include: { program: true } });
    if (!batch) throw new AuthorizationError("Batch not found");
    return { institutionId: batch.program.institutionId, divisionId: batch.program.divisionId, campusId: batch.campusId ?? batch.program.campusId };
  }

  if (!target.studentId) throw new AuthorizationError("Student or batch target is required");
  await assertStudentAccess(actor, PERMISSIONS.ADVISOR_ASSIGN, target.studentId);
  const enrollment = await prisma.studentEnrollment.findFirst({
    where: { studentId: target.studentId, status: "ACTIVE" },
    orderBy: { startedAt: "desc" },
    include: { program: true, batch: true }
  });
  if (!enrollment) throw new AuthorizationError("Student must have an active enrollment");
  return {
    institutionId: enrollment.program.institutionId,
    divisionId: enrollment.program.divisionId,
    campusId: enrollment.batch?.campusId ?? enrollment.program.campusId
  };
}

export async function createAdvisorAssignmentAction(_: AdvisorActionState, formData: FormData): Promise<AdvisorActionState> {
  const actor = await assertPermission(PERMISSIONS.ADVISOR_ASSIGN);
  const parsed = advisorAssignmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Check advisor assignment details.");
  const data = parsed.data;
  const studentId = data.targetType === "STUDENT" ? data.studentId || undefined : undefined;
  const batchId = data.targetType === "BATCH" ? data.batchId || undefined : undefined;
  const startsAt = new Date(data.startsAt);
  const endsAt = data.endsAt ? new Date(data.endsAt) : null;
  const [advisor, resource] = await Promise.all([
    getEligibleAdvisor(actor, data.advisorId),
    getTargetResource(actor, { studentId, batchId })
  ]);
  if (!advisorCoversResource(advisor, resource)) return failure("Advisor organization assignment does not cover the selected student or batch.");

  try {
    await prisma.$transaction(async (tx) => {
      const overlapping = await tx.academicAdvisorAssignment.findFirst({
        where: {
          status: "ACTIVE",
          ...(studentId ? { studentId } : { batchId, advisorId: advisor.id }),
          startsAt: { lt: endsAt ?? new Date("9999-12-31T00:00:00.000Z") },
          OR: [{ endsAt: null }, { endsAt: { gt: startsAt } }]
        },
        select: { id: true }
      });
      if (overlapping) {
        throw new AuthorizationError(studentId ? "The student already has an overlapping direct advisor assignment." : "This advisor already has an overlapping assignment to the batch.");
      }
      const assignment = await tx.academicAdvisorAssignment.create({
        data: { advisorId: advisor.id, studentId, batchId, startsAt, endsAt, createdById: actor.id }
      });
      await tx.platformAudit.create({
        data: {
          actorId: actor.id,
          action: "ACADEMIC_ADVISOR_ASSIGNED",
          entity: "AcademicAdvisorAssignment",
          entityId: assignment.id,
          metadata: { advisorId: advisor.id, studentId: studentId ?? null, batchId: batchId ?? null }
        }
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof AuthorizationError) return failure(error.message);
    throw error;
  }

  revalidatePath("/director/advisor-assignments");
  revalidatePath("/dashboard");
  return { ok: true, message: "Academic advisor assignment created." };
}

export async function endAdvisorAssignmentAction(_: AdvisorActionState, formData: FormData): Promise<AdvisorActionState> {
  const actor = await assertPermission(PERMISSIONS.ADVISOR_MANAGE);
  const parsed = endAdvisorAssignmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Invalid advisor assignment.");
  const assignment = await prisma.academicAdvisorAssignment.findUnique({
    where: { id: parsed.data.assignmentId },
    include: { batch: true, student: true }
  });
  if (!assignment) throw new AuthorizationError("Advisor assignment not found");
  if (assignment.batchId) await assertBatchAccess(actor, PERMISSIONS.ADVISOR_MANAGE, assignment.batchId);
  if (assignment.studentId) await assertStudentAccess(actor, PERMISSIONS.ADVISOR_MANAGE, assignment.studentId);
  const endedAt = new Date();
  const effectiveEnd = assignment.endsAt && assignment.endsAt > assignment.startsAt
    ? assignment.endsAt
    : endedAt > assignment.startsAt
      ? endedAt
      : null;
  await prisma.$transaction([
    prisma.academicAdvisorAssignment.update({ where: { id: assignment.id }, data: { status: "INACTIVE", endsAt: effectiveEnd } }),
    prisma.platformAudit.create({ data: { actorId: actor.id, action: "ACADEMIC_ADVISOR_ASSIGNMENT_ENDED", entity: "AcademicAdvisorAssignment", entityId: assignment.id } })
  ]);
  revalidatePath("/director/advisor-assignments");
  revalidatePath("/dashboard");
  return { ok: true, message: "Academic advisor assignment ended." };
}
