"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { careerApplicationSchema, careerNoteSchema, careerStageUpdateSchema, interviewResultSchema, interviewSchema, officeInterviewFormSchema, rmDevelopmentStartSchema, rmDevelopmentTargetSchema, rmEvaluationSchema } from "@/features/careers/schemas";
import { getCareerRole } from "@/features/careers/catalog";
import { requireRecruitmentUser } from "@/server/careers/queries";
import { getAttributedAdmissionsForRM } from "@/server/careers/rm-performance";

export type CareerActionState = { ok: boolean; message: string; applicationId?: string };
export const careerInitialState: CareerActionState = { ok: false, message: "" };

function normalizePhone(value: string) {
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

function nullable(value?: string) {
  return value && value.trim() ? value.trim() : null;
}

function objectMetadata(value: Prisma.JsonValue | null | undefined): Record<string, Prisma.JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, Prisma.JsonValue>;
}

async function checkCareerSubmissionLimit(contact: string) {
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "unknown";
  const limited = checkRateLimit(`public:career:${ip}:${normalizePhone(contact)}`, 4, 15 * 60_000);
  return limited.allowed ? null : { ok: false, message: "Please wait a few minutes before trying again." };
}

async function notifyRecruitmentUsers(tx: Prisma.TransactionClient, input: { applicationId: string; roleTitle: string; candidateName: string }) {
  const recipients = await tx.user.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      roles: { some: { role: { name: { in: ["Admin", "Director", "CEO", "COO", "HOD", "HR Manager", "HR Executive"] } } } }
    },
    select: { id: true }
  });

  if (recipients.length === 0) return;

  await tx.notification.createMany({
    data: recipients.map((recipient) => ({
      userId: recipient.id,
      type: "SYSTEM",
      title: "New career application",
      message: `${input.candidateName} applied for ${input.roleTitle}.`,
      actionUrl: "/admin/careers"
    }))
  });
}

async function notifyInternalUsers(tx: Prisma.TransactionClient, input: { title: string; message: string; actionUrl: string; roleNames?: string[] }) {
  const recipients = await tx.user.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      roles: { some: { role: { name: { in: input.roleNames ?? ["Admin", "Director", "CEO", "COO", "HOD", "HR Manager", "HR Executive"] } } } }
    },
    select: { id: true }
  });

  if (recipients.length === 0) return;

  await tx.notification.createMany({
    data: recipients.map((recipient) => ({
      userId: recipient.id,
      type: "SYSTEM",
      title: input.title,
      message: input.message,
      actionUrl: input.actionUrl
    }))
  });
}

export async function submitCareerApplicationAction(_: CareerActionState, formData: FormData): Promise<CareerActionState> {
  const parsed = careerApplicationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check your application." };

  const role = getCareerRole(parsed.data.roleSlug);
  if (!role || role.category.slug !== parsed.data.categorySlug) return { ok: false, message: "Choose a valid career role." };

  const limited = await checkCareerSubmissionLimit(parsed.data.whatsapp);
  if (limited) return limited;

  const existing = await prisma.careerApplication.findFirst({
    where: {
      roleSlug: role.slug,
      OR: [{ email: parsed.data.email.toLowerCase() }, { whatsapp: normalizePhone(parsed.data.whatsapp) }, { mobile: normalizePhone(parsed.data.mobile) }],
      stage: { notIn: ["REJECTED"] }
    },
    orderBy: { updatedAt: "desc" }
  });

  if (existing) {
    return {
      ok: true,
      applicationId: existing.id,
      message: "We already have your active application for this role. Our HR team will review it."
    };
  }

  const application = await prisma.$transaction(async (tx) => {
    const saved = await tx.careerApplication.create({
      data: {
        candidateName: parsed.data.candidateName,
        mobile: normalizePhone(parsed.data.mobile),
        whatsapp: normalizePhone(parsed.data.whatsapp),
        email: parsed.data.email.toLowerCase(),
        district: parsed.data.district,
        roleSlug: role.slug,
        roleTitle: role.title,
        categorySlug: role.category.slug,
        categoryTitle: role.category.title,
        education: parsed.data.education,
        experience: nullable(parsed.data.experience),
        currentStatus: parsed.data.currentStatus,
        relevantSkills: nullable(parsed.data.relevantSkills),
        resumeUrl: nullable(parsed.data.resumeUrl),
        profileUrl: nullable(parsed.data.profileUrl),
        shortIntro: parsed.data.shortIntro,
        availability: parsed.data.availability,
        preferredLocation: parsed.data.preferredLocation,
        consentAt: new Date(),
        metadata: {
          publicRolePath: `/careers/${role.slug}`,
          candidateInformation: {
            applicationDate: parsed.data.applicationDate,
            applicationDay: nullable(parsed.data.applicationDay),
            fatherName: parsed.data.fatherName,
            dateOfBirth: parsed.data.dateOfBirth,
            age: parsed.data.age,
            qualification: parsed.data.qualification || parsed.data.education,
            bloodGroup: parsed.data.bloodGroup,
            birthMarks: nullable(parsed.data.birthMarks),
            maritalStatus: parsed.data.maritalStatus,
            nationality: parsed.data.nationality,
            aadhaarNo: parsed.data.aadhaarNo,
            designation: parsed.data.designation,
            nomineeName: parsed.data.nomineeName,
            nomineeRelationship: parsed.data.nomineeRelationship,
            emergencyContact: normalizePhone(parsed.data.emergencyContact),
            emergencyRelationship: parsed.data.emergencyRelationship,
            presentAddress: parsed.data.presentAddress,
            permanentAddress: parsed.data.permanentAddress,
            panSubmitted: parsed.data.panSubmitted,
            aadhaarSubmitted: parsed.data.aadhaarSubmitted,
            candidateSignature: parsed.data.candidateSignature
          }
        }
      }
    });

    await tx.careerApplicationActivity.create({
      data: {
        applicationId: saved.id,
        action: "CAREER_APPLICATION_SUBMITTED",
        note: `${saved.candidateName} applied for ${saved.roleTitle}.`
      }
    });

    await tx.auditLog.create({
      data: {
        action: "CAREER_APPLICATION_SUBMITTED",
        entity: "CareerApplication",
        entityId: saved.id,
        metadata: { roleSlug: saved.roleSlug, categorySlug: saved.categorySlug }
      }
    });

    if (role.slug === "relationship-manager") {
      await tx.relationshipManagerDevelopment.create({ data: { applicationId: saved.id } });
    }

    await notifyRecruitmentUsers(tx, { applicationId: saved.id, roleTitle: saved.roleTitle, candidateName: saved.candidateName });

    return saved;
  });

  revalidatePath("/admin/careers");
  revalidatePath("/director/careers");
  revalidatePath("/executive/hr");

  return { ok: true, applicationId: application.id, message: "Your career application has been received by the AIRA Skill City HR team." };
}

export async function updateCareerStageAction(_: CareerActionState, formData: FormData): Promise<CareerActionState> {
  const actor = await requireRecruitmentUser();
  const parsed = careerStageUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check recruitment stage details." };

  const application = await prisma.$transaction(async (tx) => {
    const updated = await tx.careerApplication.update({
      where: { id: parsed.data.applicationId },
      data: {
        stage: parsed.data.stage,
        reviewedById: actor.id,
        reviewedAt: new Date(),
        joinedAt: parsed.data.stage === "JOINED" ? new Date() : undefined,
        joiningStatus: parsed.data.stage === "JOINED" ? "Joined" : undefined,
        offerStatus: parsed.data.stage === "OFFER_SENT" ? "Offer sent" : parsed.data.stage === "OFFER_ACCEPTED" ? "Offer accepted" : undefined
      }
    });

    await tx.careerApplicationActivity.create({
      data: {
        applicationId: updated.id,
        actorId: actor.id,
        action: "CAREER_STAGE_UPDATED",
        note: parsed.data.note || `Stage changed to ${parsed.data.stage.replaceAll("_", " ")}.`,
        metadata: { stage: parsed.data.stage }
      }
    });

    if (updated.roleSlug === "relationship-manager" && parsed.data.stage === "TRAINING") {
      const start = new Date();
      const end = new Date(start);
      end.setMonth(end.getMonth() + 3);
      await tx.relationshipManagerDevelopment.upsert({
        where: { applicationId: updated.id },
        update: { status: "IN_PROGRESS", developmentStart: start, developmentEnd: end },
        create: { applicationId: updated.id, status: "IN_PROGRESS", developmentStart: start, developmentEnd: end }
      });
    }

    await tx.auditLog.create({ data: { userId: actor.id, action: "CAREER_STAGE_UPDATED", entity: "CareerApplication", entityId: updated.id, metadata: { stage: parsed.data.stage } } });
    await notifyInternalUsers(tx, {
      title: "Recruitment stage updated",
      message: `${updated.candidateName} moved to ${parsed.data.stage.replaceAll("_", " ")}.`,
      actionUrl: "/admin/careers"
    });

    return updated;
  });

  revalidatePath("/admin/careers");
  revalidatePath("/director/careers");
  revalidatePath("/executive/hr");
  return { ok: true, applicationId: application.id, message: "Recruitment stage updated." };
}

export async function addCareerNoteAction(_: CareerActionState, formData: FormData): Promise<CareerActionState> {
  const actor = await requireRecruitmentUser();
  const parsed = careerNoteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Add a note." };

  await prisma.careerApplicationActivity.create({
    data: { applicationId: parsed.data.applicationId, actorId: actor.id, action: "CAREER_NOTE_ADDED", note: parsed.data.note }
  });
  await prisma.auditLog.create({ data: { userId: actor.id, action: "CAREER_NOTE_ADDED", entity: "CareerApplication", entityId: parsed.data.applicationId } });
  revalidatePath("/admin/careers");
  return { ok: true, message: "Note added." };
}

export async function scheduleCareerInterviewAction(_: CareerActionState, formData: FormData): Promise<CareerActionState> {
  const actor = await requireRecruitmentUser();
  const parsed = interviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check interview details." };

  const scheduledAt = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) return { ok: false, message: "Choose a valid interview time." };

  const interview = await prisma.$transaction(async (tx) => {
    const saved = await tx.careerInterview.create({
      data: {
        applicationId: parsed.data.applicationId,
        interviewerId: nullable(parsed.data.interviewerId),
        scheduledAt,
        mode: parsed.data.mode,
        meetingLink: nullable(parsed.data.meetingLink),
        notes: nullable(parsed.data.notes)
      }
    });
    await tx.careerApplication.update({ where: { id: parsed.data.applicationId }, data: { stage: "INTERVIEW_SCHEDULED", assignedHrId: actor.id } });
    await tx.careerApplicationActivity.create({
      data: { applicationId: parsed.data.applicationId, actorId: actor.id, action: "CAREER_INTERVIEW_SCHEDULED", note: `Interview scheduled for ${scheduledAt.toLocaleString()}.` }
    });
    await tx.auditLog.create({ data: { userId: actor.id, action: "CAREER_INTERVIEW_SCHEDULED", entity: "CareerInterview", entityId: saved.id } });
    await notifyInternalUsers(tx, {
      title: "Career interview scheduled",
      message: `Interview scheduled for ${scheduledAt.toLocaleString()}.`,
      actionUrl: "/admin/careers"
    });
    return saved;
  });

  revalidatePath("/admin/careers");
  revalidatePath("/director/careers");
  return { ok: true, applicationId: interview.applicationId, message: "Interview scheduled." };
}

export async function recordCareerInterviewResultAction(_: CareerActionState, formData: FormData): Promise<CareerActionState> {
  const actor = await requireRecruitmentUser();
  const parsed = interviewResultSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check interview result." };

  const interview = await prisma.$transaction(async (tx) => {
    const updated = await tx.careerInterview.update({
      where: { id: parsed.data.interviewId },
      data: { status: "COMPLETED", result: parsed.data.result, feedback: nullable(parsed.data.feedback) }
    });
    await tx.careerApplication.update({ where: { id: updated.applicationId }, data: { stage: "INTERVIEW_COMPLETED", reviewedById: actor.id, reviewedAt: new Date() } });
    await tx.careerApplicationActivity.create({
      data: { applicationId: updated.applicationId, actorId: actor.id, action: "CAREER_INTERVIEW_COMPLETED", note: parsed.data.feedback || parsed.data.result }
    });
    await tx.auditLog.create({ data: { userId: actor.id, action: "CAREER_INTERVIEW_COMPLETED", entity: "CareerInterview", entityId: updated.id } });
    await notifyInternalUsers(tx, {
      title: "Interview result recorded",
      message: `A career interview result was recorded: ${parsed.data.result}.`,
      actionUrl: "/admin/careers"
    });
    return updated;
  });

  revalidatePath("/admin/careers");
  revalidatePath("/director/careers");
  return { ok: true, applicationId: interview.applicationId, message: "Interview result recorded." };
}

export async function saveOfficeInterviewFormAction(_: CareerActionState, formData: FormData): Promise<CareerActionState> {
  const actor = await requireRecruitmentUser();
  const parsed = officeInterviewFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check interview form details." };

  const current = await prisma.careerApplication.findUnique({
    where: { id: parsed.data.applicationId },
    select: { id: true, candidateName: true, metadata: true }
  });
  if (!current) return { ok: false, message: "Career application not found." };

  const rounds = [1, 2, 3, 4, 5].map((roundNumber) => {
    const key = `round${roundNumber}` as const;
    return {
      roundNumber,
      interviewType: nullable(parsed.data[`${key}Type` as keyof typeof parsed.data] as string | undefined),
      interviewDateTime: nullable(parsed.data[`${key}DateTime` as keyof typeof parsed.data] as string | undefined),
      interviewerName: nullable(parsed.data[`${key}InterviewerName` as keyof typeof parsed.data] as string | undefined),
      remarks: nullable(parsed.data[`${key}Remarks` as keyof typeof parsed.data] as string | undefined),
      interviewerSignature: nullable(parsed.data[`${key}Signature` as keyof typeof parsed.data] as string | undefined)
    };
  });

  const finalResult = parsed.data.finalResult || "";
  const joiningAt = parsed.data.joiningDate && parsed.data.joiningTime ? new Date(`${parsed.data.joiningDate}T${parsed.data.joiningTime}`) : null;
  const nextStage = finalResult === "SELECTED" ? "SELECTED" : finalResult === "HOLD" ? "ON_HOLD" : finalResult === "NOT_SELECTED" ? "REJECTED" : "INTERVIEW_COMPLETED";

  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.careerApplication.update({
      where: { id: current.id },
      data: {
        stage: nextStage,
        reviewedById: actor.id,
        reviewedAt: new Date(),
        joinedAt: joiningAt && !Number.isNaN(joiningAt.getTime()) ? joiningAt : undefined,
        joiningStatus: parsed.data.joiningDate || parsed.data.joiningTime ? `Joining: ${[parsed.data.joiningDate, parsed.data.joiningTime].filter(Boolean).join(" ")}` : undefined,
        metadata: {
          ...objectMetadata(current.metadata),
          officeInterviewForm: {
            rounds,
            finalDecision: {
              result: finalResult || null,
              remarks: nullable(parsed.data.finalRemarks)
            },
            joiningDetails: {
              dateOfJoining: nullable(parsed.data.joiningDate),
              time: nullable(parsed.data.joiningTime)
            },
            updatedBy: actor.name,
            updatedAt: new Date().toISOString()
          }
        }
      }
    });

    await tx.careerApplicationActivity.create({
      data: {
        applicationId: saved.id,
        actorId: actor.id,
        action: "OFFICE_INTERVIEW_FORM_SAVED",
        note: finalResult ? `Interview form saved. Final result: ${finalResult.replaceAll("_", " ")}.` : "Interview form saved.",
        metadata: { finalResult: finalResult || null }
      }
    });

    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: "OFFICE_INTERVIEW_FORM_SAVED",
        entity: "CareerApplication",
        entityId: saved.id,
        metadata: { finalResult: finalResult || null }
      }
    });

    return saved;
  });

  revalidatePath("/admin/careers");
  revalidatePath("/director/careers");
  revalidatePath("/executive/hr");
  return { ok: true, applicationId: updated.id, message: "Interview form saved." };
}

export async function startRMDevelopmentAction(_: CareerActionState, formData: FormData): Promise<CareerActionState> {
  const actor = await requireRecruitmentUser();
  const parsed = rmDevelopmentStartSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check RM development details." };

  const start = new Date(parsed.data.developmentStart);
  if (Number.isNaN(start.getTime())) return { ok: false, message: "Choose a valid start date." };
  const end = new Date(start);
  end.setMonth(end.getMonth() + 3);

  const employee = await prisma.employee.findUnique({ where: { id: parsed.data.employeeId }, include: { user: true } });
  if (!employee) return { ok: false, message: "Employee not found." };
  const activeDevelopment = await prisma.relationshipManagerDevelopment.findFirst({
    where: {
      employeeId: employee.id,
      id: { not: parsed.data.developmentId },
      status: { in: ["IN_PROGRESS", "EVALUATION_PENDING"] }
    }
  });
  if (activeDevelopment) return { ok: false, message: "This employee already has an active RM development record." };

  const development = await prisma.$transaction(async (tx) => {
    const updated = await tx.relationshipManagerDevelopment.update({
      where: { id: parsed.data.developmentId },
      data: {
        employeeId: employee.id,
        targetAdmissions: parsed.data.targetAdmissions,
        developmentStart: start,
        developmentEnd: end,
        status: "IN_PROGRESS"
      },
      include: { application: true }
    });

    await tx.careerApplication.update({
      where: { id: updated.applicationId },
      data: { employeeId: employee.id, stage: "TRAINING", assignedHrId: actor.id }
    });

    await tx.careerApplicationActivity.create({
      data: {
        applicationId: updated.applicationId,
        actorId: actor.id,
        action: "RM_DEVELOPMENT_STARTED",
        note: `RM development started for ${employee.user.name}. Target ${parsed.data.targetAdmissions}.`
      }
    });

    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: "RM_DEVELOPMENT_STARTED",
        entity: "RelationshipManagerDevelopment",
        entityId: updated.id,
        metadata: { employeeId: employee.id, userId: employee.userId, targetAdmissions: parsed.data.targetAdmissions, developmentStart: start.toISOString(), developmentEnd: end.toISOString() }
      }
    });
    await notifyInternalUsers(tx, {
      title: "RM development started",
      message: `${employee.user.name} started the Relationship Manager development program.`,
      actionUrl: "/admin/careers"
    });

    return updated;
  });

  revalidatePath("/admin/careers");
  revalidatePath("/director/careers");
  revalidatePath("/executive/hr");
  revalidatePath("/relationship-manager");
  return { ok: true, applicationId: development.applicationId, message: "Relationship Manager development started." };
}

export async function updateRMTargetAction(_: CareerActionState, formData: FormData): Promise<CareerActionState> {
  const actor = await requireRecruitmentUser();
  const parsed = rmDevelopmentTargetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check target details." };

  const development = await prisma.$transaction(async (tx) => {
    const updated = await tx.relationshipManagerDevelopment.update({
      where: { id: parsed.data.developmentId },
      data: { targetAdmissions: parsed.data.targetAdmissions },
      include: { application: true }
    });

    await tx.careerApplicationActivity.create({
      data: {
        applicationId: updated.applicationId,
        actorId: actor.id,
        action: "RM_TARGET_CHANGED",
        note: parsed.data.note || `Target changed to ${parsed.data.targetAdmissions}.`
      }
    });

    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: "RM_TARGET_CHANGED",
        entity: "RelationshipManagerDevelopment",
        entityId: updated.id,
        metadata: { targetAdmissions: parsed.data.targetAdmissions }
      }
    });
    await notifyInternalUsers(tx, {
      title: "RM target changed",
      message: `Relationship Manager target changed to ${parsed.data.targetAdmissions}.`,
      actionUrl: "/admin/careers"
    });

    return updated;
  });

  revalidatePath("/admin/careers");
  revalidatePath("/director/careers");
  revalidatePath("/relationship-manager");
  return { ok: true, applicationId: development.applicationId, message: "RM target updated." };
}

export async function completeRMEvaluationAction(_: CareerActionState, formData: FormData): Promise<CareerActionState> {
  const actor = await requireRecruitmentUser();
  const parsed = rmEvaluationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check evaluation details." };

  const current = await prisma.relationshipManagerDevelopment.findUnique({
    where: { id: parsed.data.developmentId },
    include: { employee: true, application: true }
  });
  if (!current) return { ok: false, message: "RM development record not found." };

  const userId = current.employee?.userId;
  const actualAdmissions = userId ? (await getAttributedAdmissionsForRM(userId, current)).length : 0;

  const development = await prisma.$transaction(async (tx) => {
    const updated = await tx.relationshipManagerDevelopment.update({
      where: { id: current.id },
      data: {
        status: parsed.data.status,
        evaluationById: actor.id,
        finalEvaluationAt: new Date(),
        finalDecision: parsed.data.finalDecision,
        evaluationNotes: parsed.data.evaluationNotes,
        franchiseEligibleAt: parsed.data.status === "ELIGIBLE" ? new Date() : current.franchiseEligibleAt,
        checkpointNotes: {
          evaluatedAt: new Date().toISOString(),
          actualAdmissions,
          targetAdmissions: current.targetAdmissions
        }
      }
    });

    await tx.careerApplicationActivity.create({
      data: {
        applicationId: current.applicationId,
        actorId: actor.id,
        action: "RM_EVALUATION_COMPLETED",
        note: `${parsed.data.finalDecision}. Actual admissions: ${actualAdmissions}/${current.targetAdmissions}.`,
        metadata: { status: parsed.data.status, actualAdmissions, targetAdmissions: current.targetAdmissions }
      }
    });

    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: "RM_EVALUATION_COMPLETED",
        entity: "RelationshipManagerDevelopment",
        entityId: updated.id,
        metadata: { status: parsed.data.status, actualAdmissions, targetAdmissions: current.targetAdmissions }
      }
    });
    await notifyInternalUsers(tx, {
      title: "RM evaluation completed",
      message: `${parsed.data.finalDecision}. Actual admissions: ${actualAdmissions}/${current.targetAdmissions}.`,
      actionUrl: "/admin/careers"
    });

    return updated;
  });

  revalidatePath("/admin/careers");
  revalidatePath("/director/careers");
  revalidatePath("/relationship-manager");
  return { ok: true, applicationId: development.applicationId, message: "RM evaluation saved." };
}
