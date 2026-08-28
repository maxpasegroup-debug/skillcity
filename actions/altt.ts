"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/server/journey/queries";
import { requireDirector } from "@/server/director/queries";
import { writeDirectorLog } from "@/server/director/log";
import { assessmentResultSchema, attachLearningFlowSchema, learningFlowSchema, quizAttemptSchema, reflectionAnswerSchema, submissionSchema } from "@/features/altt/schemas";

type ActionState = { ok: boolean; message: string };

function emptyToNull(value: string | undefined) {
  return value && value.trim().length > 0 ? value : null;
}

export async function completeLearningStepAction(stepId: string, dayId: string) {
  const user = await requireStudent();
  const session = await prisma.dailyLearningSession.findUnique({ where: { studentId_dayId: { studentId: user.id, dayId } } });
  const completed = new Set(session?.completedStepIds ?? []);
  completed.add(stepId);

  const nextStep = await prisma.learningStep.findFirst({
    where: { learningFlow: { days: { some: { id: dayId } } }, id: { notIn: [...completed] } },
    orderBy: { sortOrder: "asc" }
  });

  await prisma.dailyLearningSession.upsert({
    where: { studentId_dayId: { studentId: user.id, dayId } },
    update: {
      completedStepIds: [...completed],
      currentStepId: nextStep?.id ?? null,
      status: nextStep ? "IN_PROGRESS" : "COMPLETED",
      completedAt: nextStep ? null : new Date()
    },
    create: {
      studentId: user.id,
      dayId,
      completedStepIds: [...completed],
      currentStepId: nextStep?.id ?? null,
      status: nextStep ? "IN_PROGRESS" : "COMPLETED",
      completedAt: nextStep ? null : new Date()
    }
  });

  revalidatePath(`/learn/day/${dayId}`);
}

export async function saveReflectionAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireStudent();
  const answers = Array.from(formData.entries())
    .filter(([key]) => key.startsWith("reflection:"))
    .map(([key, value]) => ({ reflectionId: key.replace("reflection:", ""), answer: String(value) }));
  const parsed = reflectionAnswerSchema.safeParse({ dayId: formData.get("dayId"), answers });
  if (!parsed.success) {
    return { ok: false, message: "Please answer each reflection question." };
  }

  await prisma.$transaction(
    parsed.data.answers.map((answer) =>
      prisma.studentReflection.upsert({
        where: { studentId_reflectionId: { studentId: user.id, reflectionId: answer.reflectionId } },
        update: { answer: answer.answer },
        create: { studentId: user.id, reflectionId: answer.reflectionId, answer: answer.answer }
      })
    )
  );

  revalidatePath(`/learn/day/${parsed.data.dayId}`);
  return { ok: true, message: "Reflection saved." };
}

export async function saveSubmissionAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireStudent();
  const parsed = submissionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your submission." };
  }

  const day = await prisma.journeyDay.findUnique({
    where: { id: parsed.data.dayId },
    include: { week: { include: { phase: true } } }
  });
  if (!day) return { ok: false, message: "Journey day not found." };

  const enrollment = await prisma.studentEnrollment.findFirst({
    where: { studentId: user.id, journeyId: day.week.phase.journeyId, status: "ACTIVE" },
    select: { batchId: true }
  });
  if (!enrollment) return { ok: false, message: "You do not have access to this journey day." };

  const activityId = emptyToNull(parsed.data.activityId);
  if (activityId) {
    const activity = await prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity || activity.dayId !== parsed.data.dayId) return { ok: false, message: "Task not found for this day." };
    if (activity.batchId && activity.batchId !== enrollment.batchId) return { ok: false, message: "This task belongs to another batch." };
  }

  const stepId = emptyToNull(parsed.data.stepId);
  const existingSubmission = await prisma.submission.findFirst({
    where: {
      studentId: user.id,
      dayId: parsed.data.dayId,
      stepId,
      activityId
    },
    orderBy: { updatedAt: "desc" }
  });

  const submissionData = {
    title: parsed.data.title,
    type: parsed.data.type,
    content: parsed.data.content,
    url: emptyToNull(parsed.data.url),
    status: parsed.data.status,
    submittedAt: parsed.data.status === "SUBMITTED" ? new Date() : null
  };
  const submission = existingSubmission
    ? await prisma.submission.update({ where: { id: existingSubmission.id }, data: submissionData })
    : await prisma.submission.create({
        data: {
          studentId: user.id,
          dayId: parsed.data.dayId,
          stepId,
          activityId,
          ...submissionData
        }
      });

  if (parsed.data.status === "SUBMITTED" && enrollment.batchId) {
    const trainerAssignments = await prisma.trainerAssignment.findMany({
      where: { batchId: enrollment.batchId, status: "ACTIVE" },
      select: { trainerId: true }
    });
    const existingQueue = await prisma.reviewQueue.findFirst({ where: { submissionId: submission.id, status: { in: ["PENDING", "IN_REVIEW"] } } });
    if (!existingQueue) {
      await prisma.reviewQueue.create({
        data: {
          submissionId: submission.id,
          studentId: user.id,
          batchId: enrollment.batchId,
          trainerId: trainerAssignments[0]?.trainerId ?? null,
          status: "PENDING"
        }
      });
    }
  }

  revalidatePath(`/learn/day/${parsed.data.dayId}`);
  revalidatePath(`/my-journey/day/${parsed.data.dayId}`);
  revalidatePath("/dashboard");
  revalidatePath("/trainer/assignments");
  revalidatePath("/trainer/submissions");
  return { ok: true, message: parsed.data.status === "SUBMITTED" ? "Submission sent." : "Draft saved." };
}

export async function saveQuizAttemptAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireStudent();
  const parsed = quizAttemptSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Enter your quiz answers." };
  }

  const attemptNumber = await prisma.quizAttempt.count({ where: { studentId: user.id, dayId: parsed.data.dayId } });
  const questionFilters = [
    parsed.data.stepId ? { stepId: parsed.data.stepId } : null,
    parsed.data.activityId ? { activityId: parsed.data.activityId } : null
  ].filter((item): item is { stepId: string } | { activityId: string } => Boolean(item));
  const questions = await prisma.quizQuestion.findMany({
    where: questionFilters.length > 0 ? { OR: questionFilters } : { id: "__no_questions__" },
    select: { id: true }
  });
  const questionOrder = questions
    .map((question) => question.id)
    .sort(() => Math.random() - 0.5);

  await prisma.quizAttempt.create({
    data: {
      studentId: user.id,
      dayId: parsed.data.dayId,
      stepId: emptyToNull(parsed.data.stepId),
      activityId: emptyToNull(parsed.data.activityId),
      questionOrder,
      answers: { response: parsed.data.answers },
      attemptNumber: attemptNumber + 1,
      completedAt: new Date()
    }
  });

  revalidatePath(`/learn/day/${parsed.data.dayId}`);
  return { ok: true, message: "Quiz attempt saved." };
}

export async function saveAssessmentResultAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireStudent();
  const parsed = assessmentResultSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success || parsed.data.score > parsed.data.maxScore) {
    return { ok: false, message: "Check the assessment score." };
  }

  await prisma.assessmentResult.create({
    data: {
      studentId: user.id,
      dayId: parsed.data.dayId,
      stepId: emptyToNull(parsed.data.stepId),
      activityId: emptyToNull(parsed.data.activityId),
      type: parsed.data.type,
      score: parsed.data.score,
      maxScore: parsed.data.maxScore,
      feedback: parsed.data.feedback
    }
  });

  revalidatePath(`/learn/day/${parsed.data.dayId}`);
  return { ok: true, message: "Assessment saved." };
}

export async function createLearningFlowAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireDirector();
  const parsed = learningFlowSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the learning flow." };
  }

  const flow = await prisma.learningFlow.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      version: parsed.data.version,
      steps: {
        create: [
          { title: "Understand", type: "INTERACTIVE_READING", sortOrder: 1, instructions: "Read the goal and understand the context.", points: 5 },
          { title: "Learn", type: "ARTICLE", sortOrder: 2, instructions: "Study the learning material.", points: 10 },
          { title: "Practice", type: "CODING_PRACTICE", sortOrder: 3, instructions: "Apply the idea through practice.", points: 15 },
          { title: "Build", type: "PROJECT_TASK", sortOrder: 4, instructions: "Create a small output from what you practiced.", points: 20 },
          { title: "Reflect", type: "REFLECTION", sortOrder: 5, instructions: "Write what changed in your understanding.", points: 10 },
          { title: "Improve", type: "CHECKLIST", sortOrder: 6, instructions: "Review and improve your work.", points: 10 },
          { title: "Master", type: "ASSESSMENT", sortOrder: 7, instructions: "Complete the final check for the day.", points: 20 }
        ]
      }
    }
  });

  await writeDirectorLog({ actorId: actor.id, action: "LEARNING_FLOW_CREATED", entity: "LearningFlow", entityId: flow.id });
  revalidatePath("/director/learning-flows");
  return { ok: true, message: "Learning flow created." };
}

export async function attachLearningFlowAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireDirector();
  const parsed = attachLearningFlowSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Select a day and learning flow." };
  }

  await prisma.journeyDay.update({ where: { id: parsed.data.dayId }, data: { learningFlowId: parsed.data.learningFlowId } });
  const existingQuestions = await prisma.reflection.count({ where: { dayId: parsed.data.dayId } });
  if (existingQuestions === 0) {
    await prisma.reflection.createMany({
      data: [
        { dayId: parsed.data.dayId, question: "What did you learn today?", sortOrder: 1 },
        { dayId: parsed.data.dayId, question: "What was difficult?", sortOrder: 2 },
        { dayId: parsed.data.dayId, question: "What will you improve tomorrow?", sortOrder: 3 }
      ]
    });
  }

  await writeDirectorLog({ actorId: actor.id, action: "LEARNING_FLOW_ATTACHED", entity: "JourneyDay", entityId: parsed.data.dayId });
  revalidatePath("/director/learning-flows");
  revalidatePath(`/learn/day/${parsed.data.dayId}`);
  return { ok: true, message: "Learning flow attached to day." };
}
