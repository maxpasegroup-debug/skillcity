"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assessmentReviewSchema, attendanceRecordSchema, attendanceSessionSchema, reflectionReviewSchema, resourceSchema, studentConcernSchema, submissionReviewSchema, trainerAnnouncementSchema, trainerClassCompletionSchema, trainerClassScheduleSchema, trainerTaskSchema } from "@/features/trainer/schemas";
import { assertTrainerBatchAccess, requireTrainer } from "@/server/trainer/queries";
import { writeAuditLog } from "@/server/audit/log";

type State = { ok: boolean; message: string };
const state: State = { ok: false, message: "" };

function emptyToNull(value: string | undefined) {
  return value && value.trim() ? value : null;
}

async function ensureStudentAccess(trainerId: string, studentId: string) {
  const enrollment = await prisma.studentEnrollment.findFirst({
    where: { studentId, status: "ACTIVE", batch: { trainerAssignments: { some: { trainerId, status: "ACTIVE" } } } },
    select: { batchId: true }
  });
  if (!enrollment?.batchId) throw new Error("Trainer cannot access this student.");
  return enrollment.batchId;
}

function dateOrNull(value: string | undefined) {
  return value ? new Date(value) : null;
}

export async function scheduleTrainerClassAction(previousState: State = state, formData: FormData): Promise<State> {
  void previousState;
  const trainer = await requireTrainer();
  const parsed = trainerClassScheduleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check class details." };

  await assertTrainerBatchAccess(trainer.id, parsed.data.batchId);
  const batch = await prisma.batch.findUnique({
    where: { id: parsed.data.batchId },
    include: { enrollments: { where: { status: "ACTIVE" }, select: { studentId: true } } }
  });
  if (!batch) return { ok: false, message: "Batch not found." };
  if (batch.status !== "ACTIVE") return { ok: false, message: "Schedule classes only for active batches." };

  const startsAt = new Date(parsed.data.startsAt);
  if (Number.isNaN(startsAt.getTime())) return { ok: false, message: "Enter a valid class start time." };
  const endsAt = dateOrNull(parsed.data.endsAt);
  if (endsAt && endsAt <= startsAt) return { ok: false, message: "Class end time must be after start time." };

  const existingEvent = await prisma.calendarEvent.findFirst({
    where: {
      batchId: batch.id,
      title: parsed.data.title,
      startsAt,
      status: { in: ["SCHEDULED", "RESCHEDULED"] }
    }
  });
  if (existingEvent) {
    const existingSession = await prisma.attendanceSession.findFirst({ where: { calendarEventId: existingEvent.id } });
    if (!existingSession) {
      await prisma.attendanceSession.create({
        data: {
          batchId: batch.id,
          trainerId: trainer.id,
          calendarEventId: existingEvent.id,
          title: existingEvent.title,
          sessionDate: existingEvent.startsAt,
          notes: existingEvent.description
        }
      });
    }
    return { ok: true, message: "This class is already scheduled." };
  }

  const event = await prisma.$transaction(async (tx) => {
    const createdEvent = await tx.calendarEvent.create({
      data: {
        batchId: batch.id,
        programId: batch.programId,
        journeyId: batch.journeyId,
        title: parsed.data.title,
        type: parsed.data.type,
        startsAt,
        endsAt,
        location: parsed.data.location?.trim() || null,
        description: parsed.data.description?.trim() || null
      }
    });

    await tx.attendanceSession.create({
      data: {
        batchId: batch.id,
        trainerId: trainer.id,
        calendarEventId: createdEvent.id,
        title: parsed.data.title,
        sessionDate: startsAt,
        notes: parsed.data.description?.trim() || null
      }
    });

    return createdEvent;
  });

  if (batch.enrollments.length > 0) {
    await prisma.notification.createMany({
      data: batch.enrollments.map((enrollment) => ({
        userId: enrollment.studentId,
        type: "ACTIVITY" as const,
        title: "Class scheduled",
        message: `${parsed.data.title} is scheduled for ${startsAt.toLocaleString("en-IN")}.`,
        actionUrl: "/calendar"
      }))
    });
  }

  revalidatePath("/trainer/calendar");
  revalidatePath("/trainer/todays-classes");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  return { ok: true, message: `Class scheduled: ${event.title}.` };
}

export async function createTrainerTaskAction(previousState: State = state, formData: FormData): Promise<State> {
  void previousState;
  const trainer = await requireTrainer();
  const parsed = trainerTaskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check task details." };

  await assertTrainerBatchAccess(trainer.id, parsed.data.batchId);
  const batch = await prisma.batch.findUnique({
    where: { id: parsed.data.batchId },
    include: { enrollments: { where: { status: "ACTIVE" }, select: { studentId: true } } }
  });
  if (!batch) return { ok: false, message: "Batch not found." };
  if (batch.status !== "ACTIVE") return { ok: false, message: "Assign tasks only to active batches." };
  if (!batch.journeyId) return { ok: false, message: "Attach a journey to this batch before assigning tasks." };

  const day = await prisma.journeyDay.findUnique({
    where: { id: parsed.data.dayId },
    include: { week: { include: { phase: true } } }
  });
  if (!day || day.week.phase.journeyId !== batch.journeyId) {
    return { ok: false, message: "Select a journey day from this batch." };
  }

  const dueAt = dateOrNull(parsed.data.dueAt);
  if (parsed.data.dueAt && (!dueAt || Number.isNaN(dueAt.getTime()))) return { ok: false, message: "Enter a valid due date." };
  const existingTask = await prisma.activity.findFirst({
    where: { batchId: batch.id, dayId: day.id, title: parsed.data.title, type: "TASK" }
  });
  if (existingTask) return { ok: true, message: "This task is already assigned to the batch." };

  const lastActivity = await prisma.activity.findFirst({ where: { dayId: day.id }, orderBy: { sortOrder: "desc" } });
  const task = await prisma.activity.create({
    data: {
      dayId: day.id,
      batchId: batch.id,
      title: parsed.data.title,
      type: "TASK",
      description: parsed.data.description,
      dueAt,
      resourceUrl: parsed.data.resourceUrl?.trim() || null,
      sortOrder: (lastActivity?.sortOrder ?? 0) + 1,
      required: true,
      points: parsed.data.points
    }
  });

  if (batch.enrollments.length > 0) {
    await prisma.notification.createMany({
      data: batch.enrollments.map((enrollment) => ({
        userId: enrollment.studentId,
        type: "ACTIVITY" as const,
        title: "New task assigned",
        message: dueAt ? `${task.title} is due on ${dueAt.toLocaleString("en-IN")}.` : `${task.title} is ready in your journey.`,
        actionUrl: `/my-journey/day/${day.id}`
      }))
    });
  }

  revalidatePath("/trainer/assignments");
  revalidatePath("/trainer/dashboard");
  revalidatePath("/dashboard");
  revalidatePath("/todays-tasks");
  revalidatePath(`/my-journey/day/${day.id}`);
  return { ok: true, message: "Task assigned to batch." };
}

export async function completeTrainerClassAction(previousState: State = state, formData: FormData): Promise<State> {
  void previousState;
  const trainer = await requireTrainer();
  const parsed = trainerClassCompletionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check class details." };

  const event = await prisma.calendarEvent.findUnique({ where: { id: parsed.data.eventId }, include: { attendanceSessions: true } });
  if (!event?.batchId) return { ok: false, message: "Class not found." };
  await assertTrainerBatchAccess(trainer.id, event.batchId);

  await prisma.$transaction(async (tx) => {
    await tx.calendarEvent.update({
      where: { id: event.id },
      data: {
        status: "COMPLETED",
        description: parsed.data.note?.trim() ? `${event.description ?? ""}\n\nCompletion note: ${parsed.data.note.trim()}`.trim() : event.description
      }
    });

    if (event.attendanceSessions.length === 0) {
      await tx.attendanceSession.create({
        data: {
          batchId: event.batchId!,
          trainerId: trainer.id,
          calendarEventId: event.id,
          title: event.title,
          sessionDate: event.startsAt,
          notes: event.description
        }
      });
    }

    await tx.auditLog.create({
      data: {
        userId: trainer.id,
        action: "TRAINER_CLASS_COMPLETED",
        entity: "CalendarEvent",
        entityId: event.id,
        metadata: { batchId: event.batchId, note: parsed.data.note?.trim() || null }
      }
    });
  });

  revalidatePath("/trainer/dashboard");
  revalidatePath("/trainer/todays-classes");
  revalidatePath("/trainer/calendar");
  revalidatePath(`/trainer/batches/${event.batchId}`);
  return { ok: true, message: "Class marked completed." };
}

export async function createAttendanceSessionAction(previousState: State = state, formData: FormData): Promise<State> {
  void previousState;
  const trainer = await requireTrainer();
  const parsed = attendanceSessionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check attendance session details." };
  await assertTrainerBatchAccess(trainer.id, parsed.data.batchId);
  await prisma.attendanceSession.create({ data: { batchId: parsed.data.batchId, trainerId: trainer.id, title: parsed.data.title, sessionDate: new Date(parsed.data.sessionDate), notes: parsed.data.notes } });
  revalidatePath("/trainer/attendance");
  return { ok: true, message: "Attendance session created." };
}

export async function markAttendanceAction(previousState: State = state, formData: FormData): Promise<State> {
  void previousState;
  const trainer = await requireTrainer();
  const parsed = attendanceRecordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check attendance record." };
  const session = await prisma.attendanceSession.findUnique({ where: { id: parsed.data.sessionId } });
  if (!session) return { ok: false, message: "Attendance session not found." };
  await assertTrainerBatchAccess(trainer.id, session.batchId);
  const studentBatchId = await ensureStudentAccess(trainer.id, parsed.data.studentId);
  if (studentBatchId !== session.batchId) return { ok: false, message: "This student does not belong to the selected attendance session batch." };
  await prisma.attendanceRecord.upsert({
    where: { sessionId_studentId: { sessionId: parsed.data.sessionId, studentId: parsed.data.studentId } },
    update: { status: parsed.data.status, note: parsed.data.note },
    create: { sessionId: parsed.data.sessionId, batchId: session.batchId, studentId: parsed.data.studentId, status: parsed.data.status, note: parsed.data.note }
  });
  revalidatePath("/trainer/attendance");
  return { ok: true, message: "Attendance saved." };
}

export async function reviewSubmissionAction(previousState: State = state, formData: FormData): Promise<State> {
  void previousState;
  const trainer = await requireTrainer();
  const parsed = submissionReviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check submission review." };
  const submission = await prisma.submission.findUnique({ where: { id: parsed.data.submissionId }, include: { student: true } });
  if (!submission) return { ok: false, message: "Submission not found." };
  await ensureStudentAccess(trainer.id, submission.studentId);
  await prisma.$transaction(async (tx) => {
    await tx.submissionReview.create({ data: { submissionId: submission.id, reviewerId: trainer.id, status: parsed.data.status, score: parsed.data.score, feedback: parsed.data.feedback } });
    await tx.submission.update({ where: { id: submission.id }, data: { status: parsed.data.status } });
    await tx.trainerFeedback.create({ data: { trainerId: trainer.id, studentId: submission.studentId, submissionId: submission.id, type: "SUBMISSION", score: parsed.data.score, comment: parsed.data.feedback } });
    await tx.reviewQueue.updateMany({ where: { submissionId: submission.id }, data: { status: "COMPLETED" } });
    if (parsed.data.status === "APPROVED" && submission.activityId) {
      await tx.studentProgress.upsert({
        where: { studentId_activityId: { studentId: submission.studentId, activityId: submission.activityId } },
        update: { status: "COMPLETED", completedAt: new Date(), score: parsed.data.score },
        create: { studentId: submission.studentId, activityId: submission.activityId, status: "COMPLETED", completedAt: new Date(), score: parsed.data.score }
      });
    }
    await tx.notification.create({
      data: {
        userId: submission.studentId,
        type: "ACTIVITY",
        title: "Submission reviewed",
        message: `Your submission "${submission.title}" was marked ${parsed.data.status.toLowerCase()}.`,
        actionUrl: `/my-journey/day/${submission.dayId}`
      }
    });
  });
  revalidatePath("/trainer/submissions");
  revalidatePath("/trainer/assignments");
  revalidatePath("/dashboard");
  revalidatePath(`/my-journey/day/${submission.dayId}`);
  return { ok: true, message: "Submission reviewed. Trainer approval remains final." };
}

export async function reviewReflectionAction(previousState: State = state, formData: FormData): Promise<State> {
  void previousState;
  const trainer = await requireTrainer();
  const parsed = reflectionReviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check reflection review." };
  const reflection = await prisma.studentReflection.findUnique({ where: { id: parsed.data.reflectionId }, include: { reflection: true } });
  if (!reflection) return { ok: false, message: "Reflection not found." };
  const batchId = await ensureStudentAccess(trainer.id, reflection.studentId);
  await prisma.trainerFeedback.create({ data: { trainerId: trainer.id, studentId: reflection.studentId, reflectionId: reflection.id, type: "REFLECTION", comment: parsed.data.comment } });
  if (parsed.data.flagConcern) {
    await prisma.studentConcern.create({ data: { trainerId: trainer.id, studentId: reflection.studentId, batchId, title: "Reflection concern", notes: parsed.data.comment, taraFollowUpRecommended: parsed.data.taraFollowUpRecommended ?? false } });
  }
  await prisma.reviewQueue.updateMany({ where: { reflectionId: reflection.id }, data: { status: "COMPLETED" } });
  revalidatePath("/trainer/reflections");
  return { ok: true, message: "Reflection reviewed." };
}

export async function reviewAssessmentAction(previousState: State = state, formData: FormData): Promise<State> {
  void previousState;
  const trainer = await requireTrainer();
  const parsed = assessmentReviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check assessment review." };
  const assessment = await prisma.assessmentResult.findUnique({ where: { id: parsed.data.assessmentId } });
  if (!assessment) return { ok: false, message: "Assessment not found." };
  await ensureStudentAccess(trainer.id, assessment.studentId);
  await prisma.$transaction([
    prisma.assessmentResult.update({ where: { id: assessment.id }, data: { score: parsed.data.score, feedback: parsed.data.feedback } }),
    prisma.trainerFeedback.create({ data: { trainerId: trainer.id, studentId: assessment.studentId, assessmentId: assessment.id, type: "ASSESSMENT", score: parsed.data.score, comment: parsed.data.feedback } }),
    prisma.reviewQueue.updateMany({ where: { assessmentId: assessment.id }, data: { status: "COMPLETED" } })
  ]);
  revalidatePath("/trainer/assessments");
  return { ok: true, message: "Assessment reviewed." };
}

export async function createResourceAction(previousState: State = state, formData: FormData): Promise<State> {
  void previousState;
  const trainer = await requireTrainer();
  const parsed = resourceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check resource details." };
  const batchId = emptyToNull(parsed.data.batchId);
  if (batchId) await assertTrainerBatchAccess(trainer.id, batchId);
  const category = await prisma.resourceCategory.upsert({ where: { name: parsed.data.categoryName }, update: {}, create: { name: parsed.data.categoryName } });
  await prisma.resource.create({ data: { trainerId: trainer.id, batchId, categoryId: category.id, type: parsed.data.type, title: parsed.data.title, description: parsed.data.description, url: parsed.data.url } });
  revalidatePath("/trainer/resources");
  return { ok: true, message: "Resource saved." };
}

export async function createTrainerAnnouncementAction(previousState: State = state, formData: FormData): Promise<State> {
  void previousState;
  const trainer = await requireTrainer();
  const parsed = trainerAnnouncementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check announcement details." };
  const batchId = emptyToNull(parsed.data.batchId);
  if (batchId) await assertTrainerBatchAccess(trainer.id, batchId);
  await prisma.trainerAnnouncement.create({ data: { trainerId: trainer.id, batchId, title: parsed.data.title, message: parsed.data.message, status: parsed.data.status, scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null, publishedAt: parsed.data.status === "PUBLISHED" ? new Date() : null } });
  revalidatePath("/trainer/announcements");
  return { ok: true, message: "Announcement saved." };
}

export async function createStudentConcernAction(previousState: State = state, formData: FormData): Promise<State> {
  void previousState;
  const trainer = await requireTrainer();
  const parsed = studentConcernSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check concern details." };
  const batchId = emptyToNull(parsed.data.batchId) ?? await ensureStudentAccess(trainer.id, parsed.data.studentId);
  await assertTrainerBatchAccess(trainer.id, batchId);
  await prisma.studentConcern.create({ data: { trainerId: trainer.id, studentId: parsed.data.studentId, batchId, title: parsed.data.title, notes: parsed.data.notes, taraFollowUpRecommended: parsed.data.taraFollowUpRecommended ?? false } });
  await writeAuditLog({
    userId: trainer.id,
    action: "TRAINER_STUDENT_FOLLOW_UP_CREATED",
    entity: "StudentConcern",
    metadata: { studentId: parsed.data.studentId, batchId, title: parsed.data.title }
  });
  revalidatePath("/trainer/students");
  revalidatePath(`/trainer/students/${parsed.data.studentId}`);
  revalidatePath(`/trainer/batches/${batchId}`);
  return { ok: true, message: "Student concern saved." };
}
