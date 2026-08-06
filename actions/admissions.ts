"use server";

import { randomInt } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/security/password";
import { createToken } from "@/lib/security/token";
import { requireAdmissionUser, requireBdmUser, ensureDefaultPipeline } from "@/server/admissions/queries";
import { approvedAdmissionPinTemplate } from "@/server/whatsapp/templates";
import { sendWhatsAppMessage } from "@/server/whatsapp/service";
import { admissionProgramSchema, applicationReviewSchema, applicationSchema, commissionSchema, communicationSchema, counsellingSchema, documentSchema, invoiceSchema, leadSchema, paymentSchema, studentCredentialSchema } from "@/features/admissions/schemas";

type State = { ok: boolean; message: string };

function emptyToNull(value: string | undefined) { return value && value.trim() ? value : null; }
function dateOrNull(value: string | undefined) { return value ? new Date(value) : null; }
function normalizeWhatsApp(value: string) {
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

function createSixDigitPin() {
  return randomInt(100000, 1000000).toString();
}

export async function createLeadAction(_: State, formData: FormData): Promise<State> {
  const actor = await requireAdmissionUser();
  const parsed = leadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check lead details." };
  const stages = await ensureDefaultPipeline();
  const lead = await prisma.lead.create({
    data: {
      ...parsed.data,
      email: emptyToNull(parsed.data.email),
      programInterestedId: emptyToNull(parsed.data.programInterestedId),
      sourceId: emptyToNull(parsed.data.sourceId),
      assignedToId: emptyToNull(parsed.data.assignedToId),
      pipelineStageId: stages[0].id,
      ownerId: actor.id
    }
  });
  await prisma.leadActivity.create({ data: { leadId: lead.id, actorId: actor.id, type: "LEAD_CREATED", summary: "Lead created." } });
  revalidatePath("/admissions/leads");
  revalidatePath("/admissions/dashboard");
  return { ok: true, message: "Lead created." };
}

export async function scheduleCounsellingAction(_: State, formData: FormData): Promise<State> {
  const actor = await requireAdmissionUser();
  const parsed = counsellingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check counselling details." };
  const session = await prisma.counsellingSession.create({
    data: {
      leadId: parsed.data.leadId,
      batchId: emptyToNull(parsed.data.batchId),
      counsellorId: actor.id,
      scheduledAt: new Date(parsed.data.scheduledAt),
      outcome: parsed.data.outcome,
      notes: parsed.data.notes,
      nextFollowUpAt: dateOrNull(parsed.data.nextFollowUpAt),
      meetingLink: emptyToNull(parsed.data.meetingLink)
    }
  });
  await prisma.leadActivity.create({ data: { leadId: parsed.data.leadId, actorId: actor.id, type: "COUNSELLING_SCHEDULED", summary: "Counselling session scheduled." } });
  revalidatePath("/admissions/counselling");
  return { ok: true, message: `Counselling scheduled for ${session.scheduledAt.toLocaleDateString()}.` };
}

export async function createApplicationAction(_: State, formData: FormData): Promise<State> {
  await requireAdmissionUser();
  const parsed = applicationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check application details." };
  await prisma.admissionApplication.create({ data: { ...parsed.data, submittedAt: parsed.data.status === "SUBMITTED" ? new Date() : null } });
  revalidatePath("/admissions/applications");
  return { ok: true, message: "Application saved." };
}

export async function reviewApplicationAction(_: State, formData: FormData): Promise<State> {
  const actor = await requireAdmissionUser();
  const parsed = applicationReviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check review details." };

  const stages = await ensureDefaultPipeline();
  const stageByStatus = {
    SUBMITTED: "application-submitted",
    UNDER_REVIEW: "application-submitted",
    APPROVED: "payment-pending",
    REJECTED: "contacted"
  } as const;
  const targetStage = stages.find((stage) => stage.slug === stageByStatus[parsed.data.status]);

  const application = await prisma.admissionApplication.findUnique({ where: { id: parsed.data.applicationId }, include: { lead: true, program: true } });
  if (!application) return { ok: false, message: "Application not found." };

  await prisma.$transaction(async (tx) => {
    await tx.admissionApplication.update({
      where: { id: application.id },
      data: {
        status: parsed.data.status,
        reviewedAt: parsed.data.status === "APPROVED" || parsed.data.status === "REJECTED" ? new Date() : application.reviewedAt
      }
    });
    await tx.lead.update({
      where: { id: application.leadId },
      data: {
        pipelineStageId: targetStage?.id ?? application.lead.pipelineStageId,
        status: parsed.data.status === "REJECTED" ? "LOST" : "OPEN",
        convertedAt: parsed.data.status === "APPROVED" ? new Date() : application.lead.convertedAt
      }
    });
    await tx.leadActivity.create({
      data: {
        leadId: application.leadId,
        actorId: actor.id,
        type: `APPLICATION_${parsed.data.status}`,
        summary: `${application.program.name} application moved to ${parsed.data.status.replaceAll("_", " ")}.`
      }
    });
    if (parsed.data.note?.trim()) {
      await tx.leadNote.create({
        data: {
          leadId: application.leadId,
          authorId: actor.id,
          note: parsed.data.note.trim()
        }
      });
    }
  });

  revalidatePath("/admissions/dashboard");
  revalidatePath("/admissions/applications");
  revalidatePath("/admissions/review");
  revalidatePath("/admissions/approved");
  revalidatePath("/admissions/rejected");
  return { ok: true, message: "Application review saved." };
}

export async function saveAdmissionProgramAction(_: State, formData: FormData): Promise<State> {
  await requireAdmissionUser();
  const parsed = admissionProgramSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check program details." };

  const data = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description,
    durationDays: parsed.data.durationDays,
    status: parsed.data.status,
    category: parsed.data.category,
    feeType: parsed.data.feeType,
    admissionStatus: parsed.data.admissionStatus,
    displayOrder: parsed.data.displayOrder,
    publicVisible: parsed.data.publicVisible === "on",
    thumbnail: emptyToNull(parsed.data.thumbnail)
  };

  if (parsed.data.id) {
    await prisma.program.update({ where: { id: parsed.data.id }, data });
  } else {
    await prisma.program.upsert({
      where: { slug: parsed.data.slug },
      update: data,
      create: data
    });
  }

  revalidatePath("/admissions/programs");
  revalidatePath("/admissions/dashboard");
  return { ok: true, message: "Program saved for admissions." };
}

export async function generateStudentCredentialAction(_: State, formData: FormData): Promise<State> {
  const actor = await requireAdmissionUser();
  const parsed = studentCredentialSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check WhatsApp number." };

  const whatsapp = normalizeWhatsApp(parsed.data.whatsapp);
  if (whatsapp.length < 7) return { ok: false, message: "Enter a valid WhatsApp number." };

  const application = await prisma.admissionApplication.findUnique({
    where: { id: parsed.data.applicationId },
    include: { lead: true, program: true, student: true }
  });

  if (!application) return { ok: false, message: "Application not found." };
  if (application.status !== "APPROVED") return { ok: false, message: "Approve the application before generating login credentials." };

  const existingCredential = await prisma.studentLoginCredential.findUnique({ where: { whatsapp } });
  if (existingCredential && existingCredential.applicationId && existingCredential.applicationId !== application.id) {
    return { ok: false, message: "This WhatsApp number is already linked to another approved student." };
  }

  const pin = createSixDigitPin();
  const pinHash = await hashPassword(pin);
  const passwordHash = await hashPassword(createToken(20));
  const studentEmail = (application.lead.email?.trim().toLowerCase() || `${whatsapp.replace(/\D/g, "")}@aira-skill-city.local`).slice(0, 255);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const { student, credential } = await prisma.$transaction(async (tx) => {
    const role = await tx.role.upsert({
      where: { name: "Student" },
      update: {},
      create: { name: "Student", description: "Learner account" }
    });

    const studentUser = await tx.user.upsert({
      where: { email: studentEmail },
      update: { name: application.lead.name, status: "ACTIVE" },
      create: {
        name: application.lead.name,
        email: studentEmail,
        passwordHash,
        status: "ACTIVE"
      }
    });

    await tx.userRole.upsert({
      where: { userId_roleId: { userId: studentUser.id, roleId: role.id } },
      update: {},
      create: { userId: studentUser.id, roleId: role.id }
    });

    await tx.admissionApplication.update({
      where: { id: application.id },
      data: { studentId: studentUser.id }
    });

    await tx.lead.update({
      where: { id: application.leadId },
      data: { whatsapp, status: "WON", convertedAt: application.lead.convertedAt ?? new Date() }
    });

    await tx.studentLoginCredential.updateMany({
      where: {
        applicationId: application.id,
        whatsapp: { not: whatsapp },
        status: "ACTIVE",
        revokedAt: null
      },
      data: { status: "REVOKED", revokedAt: new Date() }
    });

    const loginCredential = existingCredential
      ? await tx.studentLoginCredential.update({
          where: { id: existingCredential.id },
          data: {
            userId: studentUser.id,
            applicationId: application.id,
            pinHash,
            status: "ACTIVE",
            temporary: true,
            mustResetPin: true,
            expiresAt,
            revokedAt: null,
            generatedById: actor.id
          }
        })
      : await tx.studentLoginCredential.create({
          data: {
            userId: studentUser.id,
            applicationId: application.id,
            whatsapp,
            pinHash,
            expiresAt,
            generatedById: actor.id
          }
        });

    await tx.leadActivity.create({
      data: {
        leadId: application.leadId,
        actorId: actor.id,
        type: "STUDENT_LOGIN_CREDENTIAL_GENERATED",
        summary: `WhatsApp login generated for ${application.program.name}.`
      }
    });

    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: "STUDENT_LOGIN_CREDENTIAL_GENERATED",
        entity: "AdmissionApplication",
        entityId: application.id
      }
    });

    return { student: studentUser, credential: loginCredential };
  });

  const template = approvedAdmissionPinTemplate({ name: student.name, whatsapp, pin });
  await sendWhatsAppMessage({
    to: whatsapp,
    template: template.template,
    message: template.message,
    applicationId: application.id,
    userId: student.id,
    metadata: { credentialId: credential.id, programId: application.programId }
  });

  revalidatePath("/admissions/dashboard");
  revalidatePath("/admissions/approved");
  revalidatePath("/admissions/applications");
  return { ok: true, message: "Student login generated and WhatsApp welcome message prepared." };
}

export async function saveDocumentAction(_: State, formData: FormData): Promise<State> {
  await requireAdmissionUser();
  const parsed = documentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check document details." };
  await prisma.studentDocument.create({ data: { ...parsed.data, applicationId: emptyToNull(parsed.data.applicationId), studentId: emptyToNull(parsed.data.studentId), verifiedAt: parsed.data.status === "VERIFIED" ? new Date() : null } });
  revalidatePath("/admissions/documents");
  return { ok: true, message: "Document saved." };
}

export async function createInvoiceAction(_: State, formData: FormData): Promise<State> {
  await requireAdmissionUser();
  const parsed = invoiceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check invoice details." };
  const total = parsed.data.subtotal - parsed.data.discount - parsed.data.scholarship + parsed.data.gst;
  await prisma.feeInvoice.create({
    data: {
      leadId: emptyToNull(parsed.data.leadId),
      studentId: emptyToNull(parsed.data.studentId),
      programId: emptyToNull(parsed.data.programId),
      batchId: emptyToNull(parsed.data.batchId),
      invoiceNo: `SC-${Date.now()}`,
      subtotal: parsed.data.subtotal,
      discount: parsed.data.discount,
      scholarship: parsed.data.scholarship,
      gst: parsed.data.gst,
      total,
      status: "ISSUED",
      dueAt: dateOrNull(parsed.data.dueAt)
    }
  });
  revalidatePath("/admissions/payments");
  return { ok: true, message: "Invoice issued." };
}

export async function recordPaymentAction(_: State, formData: FormData): Promise<State> {
  await requireAdmissionUser();
  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check payment details." };
  await prisma.paymentTransaction.create({ data: { ...parsed.data, paidAt: parsed.data.status === "SUCCESS" ? new Date() : null } });
  if (parsed.data.status === "SUCCESS") {
    await prisma.feeInvoice.update({ where: { id: parsed.data.invoiceId }, data: { status: "PAID", paidAt: new Date() } });
  }
  revalidatePath("/admissions/payments");
  return { ok: true, message: "Payment recorded." };
}

export async function createCommissionAction(_: State, formData: FormData): Promise<State> {
  await requireBdmUser();
  const parsed = commissionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check commission details." };
  await prisma.commissionRecord.create({ data: { ...parsed.data, programId: emptyToNull(parsed.data.programId), invoiceId: emptyToNull(parsed.data.invoiceId), rate: typeof parsed.data.rate === "number" ? parsed.data.rate : null } });
  revalidatePath("/bdm/dashboard");
  return { ok: true, message: "Commission recorded for approval." };
}

export async function saveCommunicationAction(_: State, formData: FormData): Promise<State> {
  const actor = await requireAdmissionUser();
  const parsed = communicationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check communication details." };
  await prisma.communicationLog.create({ data: { ...parsed.data, leadId: emptyToNull(parsed.data.leadId), userId: actor.id, scheduledAt: dateOrNull(parsed.data.scheduledAt), sentAt: parsed.data.status === "SENT" ? new Date() : null } });
  revalidatePath("/admissions/communications");
  return { ok: true, message: "Communication saved." };
}

export async function convertPaidLeadToEnrollmentAction(invoiceId: string) {
  const actor = await requireAdmissionUser();
  const invoice = await prisma.feeInvoice.findUnique({ where: { id: invoiceId }, include: { lead: true, program: { include: { journeys: { where: { status: "ACTIVE" }, take: 1 } } }, batch: true } });
  if (!invoice?.lead || !invoice.program || !invoice.batch || invoice.status !== "PAID") throw new Error("Paid invoice with lead, program, and batch is required.");
  const email = invoice.lead.email ?? `${invoice.lead.phone}@skillcity.local`;
  const student = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name: invoice.lead.name, email, passwordHash: await hashPassword(createToken(12)), status: "ACTIVE" }
  });
  const journey = invoice.program.journeys[0] ?? await prisma.journey.findFirst({ where: { programId: invoice.program.id }, orderBy: { version: "desc" } });
  if (!journey) throw new Error("Program journey is required.");
  const enrollment = await prisma.studentEnrollment.upsert({
    where: { studentId_programId_journeyId: { studentId: student.id, programId: invoice.program.id, journeyId: journey.id } },
    update: { batchId: invoice.batch.id, status: "ACTIVE" },
    create: { studentId: student.id, programId: invoice.program.id, journeyId: journey.id, batchId: invoice.batch.id }
  });
  await prisma.enrollmentLog.create({ data: { studentId: student.id, batchId: invoice.batch.id, enrollmentId: enrollment.id, action: "PAYMENT_TO_ENROLLMENT", metadata: { invoiceId, actorId: actor.id } } });
  await prisma.lead.update({ where: { id: invoice.lead.id }, data: { status: "WON", convertedAt: new Date() } });
  revalidatePath("/admissions/enrollments");
}
