"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission, type AuthorizationUser } from "@/lib/auth/permissions";
import { assignmentCoversAcademicResource } from "@/lib/academic/validation";
import { normalizeProgramSlug, validateSkillStudioBatch } from "@/lib/skill-studio/program";
import { assignSkillStudioTrainerSchema, createSkillStudioBatchSchema, createSkillStudioProgramSchema, updateSkillStudioProgramSchema } from "@/features/skill-studio/schemas";
import { assertPermission, AuthorizationError } from "@/server/auth/authorization";
import { employeeScopeWhere, skillStudioBatchScopeWhere, skillStudioProgramScopeWhere } from "@/server/auth/scoping";
import { validateOrganizationPathForActor } from "@/server/organization/service";

export type SkillStudioActionState = { ok: boolean; message: string; slug?: string };

function failure(message: string): SkillStudioActionState {
  return { ok: false, message };
}

function optional(value?: string) {
  return value || null;
}

function dateOrNull(value?: string) {
  return value ? new Date(value) : null;
}

async function programForMutation(actor: AuthorizationUser, permission: typeof PERMISSIONS.SKILL_STUDIO_UPDATE | typeof PERMISSIONS.SKILL_STUDIO_CREATE, id: string) {
  const program = await prisma.program.findFirst({ where: { AND: [{ id }, skillStudioProgramScopeWhere(actor, permission)] } });
  if (!program) throw new AuthorizationError("Skill Studio program not found");
  return program;
}

export async function createSkillStudioProgramAction(_: SkillStudioActionState, formData: FormData): Promise<SkillStudioActionState> {
  const actor = await assertPermission(PERMISSIONS.SKILL_STUDIO_CREATE);
  const parsed = createSkillStudioProgramSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Check the program details.");
  const data = parsed.data;
  await validateOrganizationPathForActor(actor, PERMISSIONS.SKILL_STUDIO_CREATE, {
    institutionId: data.institutionId,
    divisionId: data.divisionId,
    campusId: optional(data.campusId),
    departmentId: optional(data.departmentId)
  });
  const slug = normalizeProgramSlug(data.slug);
  try {
    const program = await prisma.$transaction(async (tx) => {
      const created = await tx.program.create({
        data: {
          institutionId: data.institutionId,
          divisionId: data.divisionId,
          campusId: optional(data.campusId),
          departmentId: optional(data.departmentId),
          name: data.name,
          slug,
          description: data.description,
          durationDays: data.durationDays,
          status: data.status,
          admissionStatus: data.admissionStatus,
          operatingDomain: "SKILL_STUDIO",
          skillStudioType: data.type,
          deliveryMode: data.deliveryMode,
          learningModel: data.learningModel,
          journeys: { create: { name: `${data.name} Curriculum`, description: data.description, version: 1, status: data.status === "ACTIVE" ? "ACTIVE" : "DRAFT" } }
        }
      });
      await tx.platformAudit.create({ data: { actorId: actor.id, action: "SKILL_STUDIO_PROGRAM_CREATED", entity: "Program", entityId: created.id, metadata: { slug, learningModel: data.learningModel } } });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    revalidatePath("/skill-studio");
    return { ok: true, message: "Skill Studio program created.", slug: program.slug };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return failure("Program slug is already in use.");
    throw error;
  }
}

export async function updateSkillStudioProgramAction(_: SkillStudioActionState, formData: FormData): Promise<SkillStudioActionState> {
  const actor = await assertPermission(PERMISSIONS.SKILL_STUDIO_UPDATE);
  const parsed = updateSkillStudioProgramSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Check the program details.");
  const data = parsed.data;
  const current = await programForMutation(actor, PERMISSIONS.SKILL_STUDIO_UPDATE, data.programId);
  if (normalizeProgramSlug(data.slug) !== current.slug) return failure("Program slug is stable and cannot be changed after creation.");
  if (data.institutionId !== current.institutionId || data.divisionId !== current.divisionId || optional(data.campusId) !== current.campusId || optional(data.departmentId) !== current.departmentId) {
    return failure("Program organization cannot be moved through the Skill Studio editor.");
  }
  if ((current.status === "ARCHIVED" || data.status === "ARCHIVED") && current.status !== data.status && !hasPermission(actor, PERMISSIONS.SKILL_STUDIO_MANAGE)) {
    throw new AuthorizationError("Archiving or restoring a program requires skill-studio.manage");
  }
  await prisma.$transaction([
    prisma.program.update({ where: { id: current.id }, data: { name: data.name, description: data.description, durationDays: data.durationDays, status: data.status, admissionStatus: data.admissionStatus, skillStudioType: data.type, deliveryMode: data.deliveryMode, learningModel: data.learningModel } }),
    prisma.platformAudit.create({ data: { actorId: actor.id, action: "SKILL_STUDIO_PROGRAM_UPDATED", entity: "Program", entityId: current.id, metadata: { status: data.status, learningModel: data.learningModel } } })
  ]);
  revalidatePath("/skill-studio");
  revalidatePath(`/skill-studio/${current.slug}`);
  return { ok: true, message: "Skill Studio program updated.", slug: current.slug };
}

export async function createSkillStudioBatchAction(_: SkillStudioActionState, formData: FormData): Promise<SkillStudioActionState> {
  const actor = await assertPermission(PERMISSIONS.SKILL_STUDIO_CREATE);
  const parsed = createSkillStudioBatchSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Check the batch details.");
  const data = parsed.data;
  const program = await programForMutation(actor, PERMISSIONS.SKILL_STUDIO_CREATE, data.programId);
  const journey = data.journeyId ? await prisma.journey.findUnique({ where: { id: data.journeyId }, select: { programId: true } }) : null;
  const campusId = optional(data.campusId) ?? program.campusId;
  await validateOrganizationPathForActor(actor, PERMISSIONS.SKILL_STUDIO_CREATE, { institutionId: program.institutionId!, divisionId: program.divisionId, campusId });
  const startsAt = dateOrNull(data.startsAt);
  const endsAt = dateOrNull(data.endsAt);
  const enrollmentLimit = typeof data.enrollmentLimit === "number" ? data.enrollmentLimit : null;
  const issues = validateSkillStudioBatch({ programId: program.id, programCampusId: program.campusId, programDeliveryMode: program.deliveryMode, journeyProgramId: journey?.programId, campusId, deliveryMode: data.deliveryMode, startsAt, endsAt, enrollmentLimit });
  if (issues.length) return failure(issues[0]);
  const batch = await prisma.$transaction(async (tx) => {
    const created = await tx.batch.create({ data: { programId: program.id, journeyId: optional(data.journeyId), campusId, name: data.name, startsAt, endsAt, enrollmentLimit, deliveryMode: data.deliveryMode, status: data.status } });
    await tx.platformAudit.create({ data: { actorId: actor.id, action: "SKILL_STUDIO_BATCH_CREATED", entity: "Batch", entityId: created.id, metadata: { programId: program.id } } });
    return created;
  });
  revalidatePath(`/skill-studio/${program.slug}`);
  return { ok: true, message: `Batch ${batch.name} created.`, slug: program.slug };
}

export async function assignSkillStudioTrainerAction(_: SkillStudioActionState, formData: FormData): Promise<SkillStudioActionState> {
  const actor = await assertPermission(PERMISSIONS.SKILL_STUDIO_ASSIGN);
  const parsed = assignSkillStudioTrainerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Check the trainer assignment.");
  const data = parsed.data;
  const batch = await prisma.batch.findFirst({ where: { AND: [{ id: data.batchId }, skillStudioBatchScopeWhere(actor, PERMISSIONS.SKILL_STUDIO_ASSIGN)] }, include: { program: true } });
  if (!batch) throw new AuthorizationError("Skill Studio batch not found");
  const now = new Date();
  const trainer = await prisma.user.findFirst({
    where: { id: data.trainerId, status: "ACTIVE", deletedAt: null, roles: { some: { role: { name: "Trainer" } } }, employeeProfile: { AND: [employeeScopeWhere(actor, PERMISSIONS.SKILL_STUDIO_ASSIGN), { status: { in: ["ACTIVE", "PROBATION", "ON_NOTICE"] } }] } },
    select: { id: true, employeeProfile: { include: { organizationAssignments: { where: { startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] } } } } }
  });
  if (!trainer?.employeeProfile) return failure("Trainer must be an active, authorized Employee with trainer access.");
  const resource = { institutionId: batch.program.institutionId, divisionId: batch.program.divisionId, campusId: batch.campusId ?? batch.program.campusId };
  if (![trainer.employeeProfile, ...trainer.employeeProfile.organizationAssignments].some((assignment) => assignmentCoversAcademicResource(assignment, resource))) {
    throw new AuthorizationError("Trainer organization assignment does not cover this batch");
  }
  const startsAt = dateOrNull(data.startsAt);
  const endsAt = dateOrNull(data.endsAt);
  const assignment = await prisma.$transaction(async (tx) => {
    const saved = await tx.trainerAssignment.upsert({
      where: { trainerId_batchId_role: { trainerId: trainer.id, batchId: batch.id, role: "Skill Studio Trainer" } },
      update: { status: "ACTIVE", startsAt, endsAt },
      create: { trainerId: trainer.id, batchId: batch.id, role: "Skill Studio Trainer", startsAt, endsAt }
    });
    await tx.platformAudit.create({ data: { actorId: actor.id, action: "SKILL_STUDIO_TRAINER_ASSIGNED", entity: "TrainerAssignment", entityId: saved.id, metadata: { batchId: batch.id, trainerId: trainer.id } } });
    return saved;
  });
  revalidatePath(`/skill-studio/${batch.program.slug}`);
  return { ok: true, message: `Trainer assignment ${assignment.status.toLowerCase()}.`, slug: batch.program.slug };
}
