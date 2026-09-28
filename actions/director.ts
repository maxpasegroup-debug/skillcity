"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, resolveAuthorizedScopes } from "@/lib/auth/permissions";
import { requireDirector } from "@/server/director/queries";
import { assertActivityAccess, assertBatchAccess, assertBlueprintAccess, assertJourneyAccess, assertJourneyDayAccess, assertProgramAccess } from "@/server/auth/resource-access";
import { employeeScopeWhere } from "@/server/auth/scoping";
import { writeDirectorLog } from "@/server/director/log";
import { assignmentCoversAcademicResource, validateBatchConfiguration } from "@/lib/academic/validation";
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
  const existing = await prisma.program.findUnique({ where: { slug: data.slug }, select: { id: true } });
  if (existing) await assertProgramAccess(actor, PERMISSIONS.DIRECTOR_ACCESS, existing.id);
  const resolved = resolveAuthorizedScopes(actor, PERMISSIONS.DIRECTOR_ACCESS);
  if (!existing && !resolved.global && resolved.assignments.length !== 1) return { ok: false, message: "Choose a single active organization scope before creating a program." };
  const organization = resolved.assignments[0];
  const program = existing ? await prisma.program.update({
    where: { id: existing.id },
    data: {
      name: data.name,
      description: data.description,
      durationDays: data.durationDays,
      status,
      thumbnail: emptyToNull(data.thumbnail)
    }
  }) : await prisma.program.create({
    data: {
      institutionId: organization?.institutionId,
      divisionId: organization?.divisionId,
      campusId: organization?.campusId,
      departmentId: organization?.departmentId,
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
  await assertProgramAccess(actor, PERMISSIONS.DIRECTOR_ACCESS, parsed.data.programId);
  if (parsed.data.journeyId) await assertJourneyAccess(actor, PERMISSIONS.DIRECTOR_ACCESS, parsed.data.journeyId);

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
  await assertBlueprintAccess(actor, PERMISSIONS.DIRECTOR_ACCESS, blueprintId);
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
  await assertProgramAccess(actor, PERMISSIONS.DIRECTOR_ACCESS, parsed.data.programId);
  if (parsed.data.journeyId) await assertJourneyAccess(actor, PERMISSIONS.DIRECTOR_ACCESS, parsed.data.journeyId);

  const [program, journey] = await Promise.all([
    prisma.program.findUnique({ where: { id: parsed.data.programId }, select: { id: true, campusId: true } }),
    parsed.data.journeyId ? prisma.journey.findUnique({ where: { id: parsed.data.journeyId }, select: { programId: true } }) : null
  ]);
  if (!program) return { ok: false, message: "Program not found." };
  const startsAt = dateOrNull(parsed.data.startsAt);
  const endsAt = dateOrNull(parsed.data.endsAt);
  const enrollmentLimit = typeof parsed.data.enrollmentLimit === "number" ? parsed.data.enrollmentLimit : null;
  const issues = validateBatchConfiguration({ program, journey, campusId: program.campusId, startsAt, endsAt, enrollmentLimit });
  if (issues.length) return { ok: false, message: issues[0] };

  const batch = await prisma.batch.create({
    data: {
      programId: parsed.data.programId,
      campusId: program.campusId,
      journeyId: emptyToNull(parsed.data.journeyId),
      name: parsed.data.name,
      startsAt,
      endsAt,
      enrollmentLimit,
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
  await assertBatchAccess(actor, PERMISSIONS.DIRECTOR_ACCESS, parsed.data.batchId);
  const now = new Date();
  const trainer = await prisma.user.findFirst({
    where: {
      id: parsed.data.trainerId,
      deletedAt: null,
      status: "ACTIVE",
      roles: { some: { role: { name: "Trainer" } } },
      employeeProfile: { AND: [employeeScopeWhere(actor, PERMISSIONS.DIRECTOR_ACCESS), { status: { in: ["ACTIVE", "PROBATION", "ON_NOTICE"] } }] }
    },
    select: {
      id: true,
      employeeProfile: {
        select: {
          institutionId: true,
          divisionId: true,
          campusId: true,
          organizationAssignments: {
            where: { startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
            select: { institutionId: true, divisionId: true, campusId: true }
          }
        }
      }
    }
  });
  if (!trainer) return { ok: false, message: "Trainer must be an active, authorized employee with trainer access." };
  const batch = await prisma.batch.findUnique({ where: { id: parsed.data.batchId }, include: { program: true } });
  if (!batch) return { ok: false, message: "Batch not found." };
  const resource = { institutionId: batch.program.institutionId, divisionId: batch.program.divisionId, campusId: batch.campusId ?? batch.program.campusId };
  const employeeAssignments = trainer.employeeProfile ? [trainer.employeeProfile, ...trainer.employeeProfile.organizationAssignments] : [];
  if (!employeeAssignments.some((assignment) => assignmentCoversAcademicResource(assignment, resource))) {
    return { ok: false, message: "Trainer organization assignment does not cover this batch." };
  }
  const startsAt = dateOrNull(parsed.data.startsAt);
  const endsAt = dateOrNull(parsed.data.endsAt);
  if (startsAt && endsAt && endsAt <= startsAt) return { ok: false, message: "Assignment end date must be after its start date." };

  const assignment = await prisma.trainerAssignment.upsert({
    where: { trainerId_batchId_role: { trainerId: parsed.data.trainerId, batchId: parsed.data.batchId, role: parsed.data.role } },
    update: { status: "ACTIVE", startsAt, endsAt },
    create: {
      trainerId: parsed.data.trainerId,
      batchId: parsed.data.batchId,
      role: parsed.data.role,
      startsAt,
      endsAt
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
  if (parsed.data.programId) await assertProgramAccess(actor, PERMISSIONS.DIRECTOR_ACCESS, parsed.data.programId);
  if (parsed.data.batchId) await assertBatchAccess(actor, PERMISSIONS.DIRECTOR_ACCESS, parsed.data.batchId);

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
  if (parsed.data.programId) await assertProgramAccess(actor, PERMISSIONS.DIRECTOR_ACCESS, parsed.data.programId);
  if (!parsed.data.programId && !resolveAuthorizedScopes(actor, PERMISSIONS.DIRECTOR_ACCESS).global) return { ok: false, message: "Scoped content must be linked to an authorized program." };

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
  if (parsed.data.programId) await assertProgramAccess(actor, PERMISSIONS.DIRECTOR_ACCESS, parsed.data.programId);
  if (parsed.data.journeyId) await assertJourneyAccess(actor, PERMISSIONS.DIRECTOR_ACCESS, parsed.data.journeyId);
  if (parsed.data.batchId) await assertBatchAccess(actor, PERMISSIONS.DIRECTOR_ACCESS, parsed.data.batchId);
  if (!parsed.data.programId && !parsed.data.journeyId && !parsed.data.batchId && !resolveAuthorizedScopes(actor, PERMISSIONS.DIRECTOR_ACCESS).global) return { ok: false, message: "Scoped events must be linked to an authorized program, journey, or batch." };

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
  await assertJourneyDayAccess(actor, PERMISSIONS.DIRECTOR_ACCESS, parsed.data.dayId);

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
  await assertActivityAccess(actor, PERMISSIONS.DIRECTOR_ACCESS, activityId);
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
