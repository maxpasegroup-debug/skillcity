import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/server/journey/queries";
import type { AlttProgressView, AlttStepView } from "@/types/altt";

export async function getLearningSession(studentId: string, dayId: string) {
  const day = await prisma.journeyDay.findUnique({
    where: { id: dayId },
    include: {
      learningFlow: { include: { steps: { orderBy: { sortOrder: "asc" } } } },
      activities: { orderBy: { sortOrder: "asc" } },
      reflections: { orderBy: { sortOrder: "asc" }, include: { answers: { where: { studentId } } } },
      submissions: { where: { studentId }, orderBy: { updatedAt: "desc" } },
      assessmentResults: { where: { studentId }, orderBy: { completedAt: "desc" } },
      quizAttempts: { where: { studentId }, orderBy: { createdAt: "desc" } },
      week: { include: { phase: { include: { journey: true } } } }
    }
  });

  if (!day) {
    notFound();
  }

  const enrollment = await prisma.studentEnrollment.findFirst({
    where: { studentId, journeyId: day.week.phase.journeyId, status: "ACTIVE" }
  });

  if (!enrollment) {
    notFound();
  }

  const steps: AlttStepView[] =
    day.learningFlow?.steps.map((step) => ({
      id: step.id,
      title: step.title,
      type: step.type,
      instructions: step.instructions,
      sortOrder: step.sortOrder,
      required: step.required,
      points: step.points,
      completed: false
    })) ?? [];

  const session = await prisma.dailyLearningSession.upsert({
    where: { studentId_dayId: { studentId, dayId } },
    update: { status: "IN_PROGRESS" },
    create: { studentId, dayId, status: "IN_PROGRESS", currentStepId: steps[0]?.id }
  });

  const completed = new Set(session.completedStepIds);
  const viewedSteps = steps.map((step) => ({ ...step, completed: completed.has(step.id) }));
  const currentStep = viewedSteps.find((step) => !step.completed) ?? viewedSteps.at(-1) ?? null;
  const requiredSteps = viewedSteps.filter((step) => step.required);
  const completedRequired = requiredSteps.filter((step) => step.completed);
  const reflectionComplete = day.reflections.length > 0 && day.reflections.every((reflection) => reflection.answers.length > 0);
  const latestSubmission = day.submissions[0];
  const needsSubmission = viewedSteps.some((step) => ["PROJECT_TASK", "FILE_UPLOAD", "CODING_PRACTICE"].includes(step.type));
  const needsAssessment = viewedSteps.some((step) => step.type === "ASSESSMENT");
  const assessmentComplete = day.assessmentResults.length > 0;

  const progress: AlttProgressView = {
    currentStep,
    completedSteps: completedRequired.length,
    totalSteps: requiredSteps.length,
    completionPercent: requiredSteps.length === 0 ? 0 : Math.round((completedRequired.length / requiredSteps.length) * 100),
    reflectionStatus: reflectionComplete ? "Complete" : "Pending",
    submissionStatus: needsSubmission ? latestSubmission?.status ?? "DRAFT" : "Not Required",
    assessmentStatus: needsAssessment ? (assessmentComplete ? "Complete" : "Pending") : "Not Required"
  };

  return { day, session, steps: viewedSteps, progress };
}

export async function requireLearningSession(dayId: string) {
  const user = await requireStudent();
  return getLearningSession(user.id, dayId);
}

export function getDirectorLearningFlows() {
  return prisma.learningFlow.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: { steps: { orderBy: { sortOrder: "asc" } }, days: true }
  });
}
