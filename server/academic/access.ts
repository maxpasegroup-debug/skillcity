import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AuthorizationError } from "@/server/auth/authorization";

export async function assertStudentDayAccess(studentId: string, dayId: string) {
  const day = await prisma.journeyDay.findUnique({
    where: { id: dayId },
    include: { week: { include: { phase: true } } }
  });
  if (!day) throw new AuthorizationError("Journey day not found");
  const enrollment = await prisma.studentEnrollment.findFirst({
    where: { studentId, journeyId: day.week.phase.journeyId, status: "ACTIVE" },
    select: { id: true, batchId: true, programId: true, journeyId: true, currentDay: true }
  });
  if (!enrollment) throw new AuthorizationError("Student is not enrolled in this journey");
  return { day, enrollment };
}

export async function assertStudentActivityAccess(studentId: string, activityId: string) {
  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!activity) throw new AuthorizationError("Learning activity not found");
  const access = await assertStudentDayAccess(studentId, activity.dayId);
  if (activity.batchId && activity.batchId !== access.enrollment.batchId) throw new AuthorizationError("Learning activity belongs to another batch");
  return { ...access, activity };
}

export async function assertStudentStepAccess(studentId: string, dayId: string, stepId: string) {
  const access = await assertStudentDayAccess(studentId, dayId);
  const step = await prisma.learningStep.findFirst({ where: { id: stepId, learningFlow: { days: { some: { id: dayId } } } } });
  if (!step) throw new AuthorizationError("Learning step does not belong to this journey day");
  return { ...access, step };
}

export async function assertStudentReflectionAccess(studentId: string, dayId: string, reflectionIds: string[]) {
  await assertStudentDayAccess(studentId, dayId);
  const count = await prisma.reflection.count({ where: { id: { in: reflectionIds }, dayId } });
  if (count !== new Set(reflectionIds).size) throw new AuthorizationError("Reflection does not belong to this journey day");
}

export type TrainerAcademicAssignment = {
  batchId: string;
  journeyId: string | null;
  studentIds: string[];
};

export async function getTrainerAcademicAssignments(trainerId: string, now = new Date()): Promise<TrainerAcademicAssignment[]> {
  const batches = await prisma.batch.findMany({
    where: {
      status: "ACTIVE",
      trainerAssignments: {
        some: {
          trainerId,
          status: "ACTIVE",
          AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }]
        }
      }
    },
    select: { id: true, journeyId: true, enrollments: { where: { status: "ACTIVE" }, select: { studentId: true } } }
  });
  return batches.map((batch) => ({ batchId: batch.id, journeyId: batch.journeyId, studentIds: batch.enrollments.map((item) => item.studentId) }));
}

export function trainerSubmissionScope(assignments: TrainerAcademicAssignment[]): Prisma.SubmissionWhereInput {
  return {
    OR: assignments.flatMap((assignment) => assignment.journeyId ? [{
      studentId: { in: assignment.studentIds },
      day: { week: { phase: { journeyId: assignment.journeyId } } },
      AND: [{ OR: [{ activityId: null }, { activity: { batchId: null } }, { activity: { batchId: assignment.batchId } }] }]
    }] : [])
  };
}

export function trainerReflectionScope(assignments: TrainerAcademicAssignment[]): Prisma.StudentReflectionWhereInput {
  return {
    OR: assignments.flatMap((assignment) => assignment.journeyId ? [{
      studentId: { in: assignment.studentIds },
      reflection: { day: { week: { phase: { journeyId: assignment.journeyId } } } }
    }] : [])
  };
}

export function trainerAssessmentScope(assignments: TrainerAcademicAssignment[]): Prisma.AssessmentResultWhereInput {
  return {
    OR: assignments.flatMap((assignment) => assignment.journeyId ? [{
      studentId: { in: assignment.studentIds },
      day: { week: { phase: { journeyId: assignment.journeyId } } },
      AND: [{ OR: [{ activityId: null }, { activity: { batchId: null } }, { activity: { batchId: assignment.batchId } }] }]
    }] : [])
  };
}

export async function assertTrainerArtifactAccess(trainerId: string, input: { studentId: string; journeyId: string; activityBatchId?: string | null }) {
  const assignments = await getTrainerAcademicAssignments(trainerId);
  const match = assignments.find((assignment) => assignment.journeyId === input.journeyId && assignment.studentIds.includes(input.studentId) && (!input.activityBatchId || input.activityBatchId === assignment.batchId));
  if (!match) throw new AuthorizationError("Trainer cannot access this academic record");
  return match;
}
