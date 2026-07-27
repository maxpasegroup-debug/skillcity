"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireDirector } from "@/server/director/queries";
import { writeDirectorLog } from "@/server/director/log";
import {
  activityPlannerSchema,
  batchFormSchema,
  blueprintFormSchema,
  calendarEventSchema,
  contentLibrarySchema,
  directorAnnouncementSchema,
  programFormSchema,
  trainerAssignmentSchema
} from "@/features/director/schemas";

type DirectorState = { ok: boolean; message: string };

function emptyToNull(value: string | undefined) {
  return value && value.trim().length > 0 ? value : null;
}

function dateOrNull(value: string | undefined) {
  return value ? new Date(value) : null;
}

export async function saveProgramAction(_: DirectorState, formData: FormData): Promise<DirectorState> {
  const actor = await requireDirector();
  const parsed = programFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the program details." };
  }

  const data = parsed.data;
  const status = data.archive === "on" ? "ARCHIVED" : data.status;
  const program = await prisma.program.upsert({
    where: { slug: data.slug },
    update: {
      name: data.name,
      description: data.description,
      durationDays: data.durationDays,
      status,
      thumbnail: emptyToNull(data.thumbnail)
    },
    create: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      durationDays: data.durationDays,
      status,
      thumbnail: emptyToNull(data.thumbnail),
      journeys: {
        create: {
          name: `${data.name} Journey`,
          description: data.description,
          version: data.journeyVersion,
          status: data.enrollmentOpen === "on" ? "ACTIVE" : "DRAFT"
        }
      }
    }
  });

  await writeDirectorLog({ actorId: actor.id, action: "PROGRAM_SAVED", entity: "Program", entityId: program.id });
  revalidatePath("/director/programs");
  revalidatePath("/director/dashboard");
  return { ok: true, message: "Program saved." };
}

export async function createBlueprintAction(_: DirectorState, formData: FormData): Promise<DirectorState> {
  const actor = await requireDirector();
  const parsed = blueprintFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the blueprint details." };
  }

  const blueprint = await prisma.blueprint.create({
    data: {
      programId: parsed.data.programId,
      journeyId: emptyToNull(parsed.data.journeyId),
      name: parsed.data.name,
      description: parsed.data.description,
      createdById: actor.id,
      versions: {
        create: {
          version: 1,
          title: parsed.data.versionTitle,
          notes: parsed.data.description
        }
      }
    }
  });

  await writeDirectorLog({ actorId: actor.id, action: "BLUEPRINT_CREATED", entity: "Blueprint", entityId: blueprint.id });
  revalidatePath("/director/blueprints");
  return { ok: true, message: "Blueprint created." };
}

export async function duplicateBlueprintAction(blueprintId: string) {
  const actor = await requireDirector();
  const source = await prisma.blueprint.findUnique({ where: { id: blueprintId }, include: { versions: { orderBy: { version: "desc" }, take: 1 } } });
  if (!source) {
    throw new Error("Blueprint not found");
  }

  const copy = await prisma.blueprint.create({
    data: {
      programId: source.programId,
      journeyId: source.journeyId,
      name: `${source.name} Copy`,
      description: source.description,
      createdById: actor.id,
      versions: {
        create: {
          version: 1,
          title: source.versions[0]?.title ?? `${source.name} Version 1`,
          notes: source.versions[0]?.notes,
          sourceVersionId: source.versions[0]?.id
        }
      }
    }
  });

  await writeDirectorLog({ actorId: actor.id, action: "BLUEPRINT_DUPLICATED", entity: "Blueprint", entityId: copy.id });
  revalidatePath("/director/blueprints");
}

export async function createBatchAction(_: DirectorState, formData: FormData): Promise<DirectorState> {
  const actor = await requireDirector();
  const parsed = batchFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the batch details." };
  }

  const batch = await prisma.batch.create({
    data: {
      programId: parsed.data.programId,
      journeyId: emptyToNull(parsed.data.journeyId),
      name: parsed.data.name,
      startsAt: dateOrNull(parsed.data.startsAt),
      endsAt: dateOrNull(parsed.data.endsAt),
      enrollmentLimit: typeof parsed.data.enrollmentLimit === "number" ? parsed.data.enrollmentLimit : null,
      status: parsed.data.status
    }
  });

  await writeDirectorLog({ actorId: actor.id, action: "BATCH_CREATED", entity: "Batch", entityId: batch.id });
  revalidatePath("/director/batch-management");
  revalidatePath("/director/dashboard");
  return { ok: true, message: "Batch created." };
}

export async function assignTrainerAction(_: DirectorState, formData: FormData): Promise<DirectorState> {
  const actor = await requireDirector();
  const parsed = trainerAssignmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the trainer assignment." };
  }

  const assignment = await prisma.trainerAssignment.upsert({
    where: { trainerId_batchId_role: { trainerId: parsed.data.trainerId, batchId: parsed.data.batchId, role: parsed.data.role } },
    update: { status: "ACTIVE", startsAt: dateOrNull(parsed.data.startsAt), endsAt: dateOrNull(parsed.data.endsAt) },
    create: {
      trainerId: parsed.data.trainerId,
      batchId: parsed.data.batchId,
      role: parsed.data.role,
      startsAt: dateOrNull(parsed.data.startsAt),
      endsAt: dateOrNull(parsed.data.endsAt)
    }
  });

  await writeDirectorLog({ actorId: actor.id, action: "TRAINER_ASSIGNED", entity: "TrainerAssignment", entityId: assignment.id });
  revalidatePath("/director/trainer-assignment");
  return { ok: true, message: "Trainer assigned." };
}

export async function createDirectorAnnouncementAction(_: DirectorState, formData: FormData): Promise<DirectorState> {
  const actor = await requireDirector();
  const parsed = directorAnnouncementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the announcement." };
  }

  const publishedAt = parsed.data.status === "PUBLISHED" ? new Date() : null;
  const announcement = await prisma.directorAnnouncement.create({
    data: {
      authorId: actor.id,
      type: parsed.data.type,
      recipientType: parsed.data.recipientType,
      programId: emptyToNull(parsed.data.programId),
      batchId: emptyToNull(parsed.data.batchId),
      title: parsed.data.title,
      message: parsed.data.message,
      status: parsed.data.status,
      scheduledAt: dateOrNull(parsed.data.scheduledAt),
      publishedAt
    }
  });

  if (parsed.data.status === "PUBLISHED") {
    await prisma.announcement.create({
      data: {
        authorId: actor.id,
        programId: emptyToNull(parsed.data.programId),
        batchId: emptyToNull(parsed.data.batchId),
        audience: parsed.data.recipientType === "BATCH" ? "BATCH" : parsed.data.recipientType === "PROGRAM" ? "PROGRAM" : "ALL",
        title: parsed.data.title,
        message: parsed.data.message,
        publishedAt
      }
    });
  }

  await writeDirectorLog({ actorId: actor.id, action: "DIRECTOR_ANNOUNCEMENT_CREATED", entity: "DirectorAnnouncement", entityId: announcement.id });
  revalidatePath("/director/communications");
  revalidatePath("/dashboard");
  return { ok: true, message: "Communication saved." };
}

export async function createContentLibraryAction(_: DirectorState, formData: FormData): Promise<DirectorState> {
  const actor = await requireDirector();
  const parsed = contentLibrarySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the content item." };
  }

  const item = await prisma.contentLibrary.create({
    data: {
      uploadedById: actor.id,
      programId: emptyToNull(parsed.data.programId),
      title: parsed.data.title,
      type: parsed.data.type,
      url: parsed.data.url,
      description: parsed.data.description,
      duration: typeof parsed.data.duration === "number" ? parsed.data.duration : null
    }
  });

  await writeDirectorLog({ actorId: actor.id, action: "CONTENT_LIBRARY_ITEM_CREATED", entity: "ContentLibrary", entityId: item.id });
  revalidatePath("/director/content-library");
  return { ok: true, message: "Content saved." };
}

export async function createCalendarEventAction(_: DirectorState, formData: FormData): Promise<DirectorState> {
  const actor = await requireDirector();
  const parsed = calendarEventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the calendar event." };
  }

  const event = await prisma.calendarEvent.create({
    data: {
      programId: emptyToNull(parsed.data.programId),
      journeyId: emptyToNull(parsed.data.journeyId),
      batchId: emptyToNull(parsed.data.batchId),
      title: parsed.data.title,
      description: parsed.data.description,
      type: parsed.data.type,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: dateOrNull(parsed.data.endsAt),
      location: parsed.data.location
    }
  });

  await writeDirectorLog({ actorId: actor.id, action: "CALENDAR_EVENT_CREATED", entity: "CalendarEvent", entityId: event.id });
  revalidatePath("/director/calendar");
  revalidatePath("/director/dashboard");
  return { ok: true, message: "Calendar event saved." };
}

export async function addActivityToDayAction(_: DirectorState, formData: FormData): Promise<DirectorState> {
  const actor = await requireDirector();
  const parsed = activityPlannerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the activity." };
  }

  const last = await prisma.activity.findFirst({ where: { dayId: parsed.data.dayId }, orderBy: { sortOrder: "desc" } });
  const activity = await prisma.activity.create({
    data: {
      dayId: parsed.data.dayId,
      title: parsed.data.title,
      type: parsed.data.type,
      description: parsed.data.description,
      duration: typeof parsed.data.duration === "number" ? parsed.data.duration : null,
      required: parsed.data.required === "on",
      points: parsed.data.points,
      sortOrder: (last?.sortOrder ?? 0) + 1
    }
  });

  await writeDirectorLog({ actorId: actor.id, action: "DAY_ACTIVITY_ADDED", entity: "Activity", entityId: activity.id });
  revalidatePath("/director/journey-planner");
  revalidatePath("/my-journey");
  return { ok: true, message: "Activity added to day." };
}

export async function reorderActivityAction(activityId: string, direction: "up" | "down") {
  const actor = await requireDirector();
  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!activity) {
    throw new Error("Activity not found");
  }

  const swap = await prisma.activity.findFirst({
    where: {
      dayId: activity.dayId,
      sortOrder: direction === "up" ? { lt: activity.sortOrder } : { gt: activity.sortOrder }
    },
    orderBy: { sortOrder: direction === "up" ? "desc" : "asc" }
  });

  if (!swap) {
    return;
  }

  await prisma.$transaction([
    prisma.activity.update({ where: { id: activity.id }, data: { sortOrder: -activity.sortOrder } }),
    prisma.activity.update({ where: { id: swap.id }, data: { sortOrder: activity.sortOrder } }),
    prisma.activity.update({ where: { id: activity.id }, data: { sortOrder: swap.sortOrder } })
  ]);

  await writeDirectorLog({ actorId: actor.id, action: "DAY_ACTIVITY_REORDERED", entity: "Activity", entityId: activity.id });
  revalidatePath("/director/journey-planner");
  revalidatePath("/my-journey");
}
