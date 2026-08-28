"use server";

import { randomInt } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/security/password";
import { createToken } from "@/lib/security/token";
import { ensureDefaultPipeline, requireAdmissionUser } from "@/server/admissions/queries";
import { approvedAdmissionPinTemplate } from "@/server/whatsapp/templates";
import { sendWhatsAppMessage } from "@/server/whatsapp/service";
import { admissionActivationSchema, manualPaymentCaptureSchema, paymentRequestSchema, paymentVerificationSchema } from "@/features/admissions/phase4-schemas";

type State = { ok: boolean; message: string };

function dateOrNull(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeWhatsApp(value: string) {
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

function createSixDigitPin() {
  return randomInt(100000, 1000000).toString();
}

async function stageId(slug: string) {
  const stages = await ensureDefaultPipeline();
  return stages.find((stage) => stage.slug === slug)?.id;
}

function invoiceTotal(data: { subtotal: number; discount: number; scholarship: number; gst: number }) {
  return Math.max(0, data.subtotal - data.discount - data.scholarship + data.gst);
}

export async function createPaymentRequestForApplicationAction(_: State, formData: FormData): Promise<State> {
  const actor = await requireAdmissionUser();
  const parsed = paymentRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check payment request." };

  const application = await prisma.admissionApplication.findUnique({
    where: { id: parsed.data.applicationId },
    include: { lead: true, program: true }
  });
  if (!application) return { ok: false, message: "Application not found." };
  if (application.status !== "APPROVED") return { ok: false, message: "Approve the application before requesting payment." };

  const existingInvoice = await prisma.feeInvoice.findFirst({
    where: {
      leadId: application.leadId,
      programId: application.programId,
      status: { in: ["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID"] }
    },
    orderBy: { createdAt: "desc" }
  });
  if (existingInvoice) {
    return { ok: true, message: `Payment request already exists: ${existingInvoice.invoiceNo}.` };
  }

  const total = invoiceTotal(parsed.data);
  const paymentPendingStageId = await stageId("payment-pending");
  const invoice = await prisma.$transaction(async (tx) => {
    const created = await tx.feeInvoice.create({
      data: {
        leadId: application.leadId,
        programId: application.programId,
        invoiceNo: `SC-${Date.now()}`,
        subtotal: parsed.data.subtotal,
        discount: parsed.data.discount,
        scholarship: parsed.data.scholarship,
        gst: parsed.data.gst,
        total,
        status: total === 0 ? "PAID" : "ISSUED",
        paidAt: total === 0 ? new Date() : null,
        dueAt: dateOrNull(parsed.data.dueAt)
      }
    });

    await tx.lead.update({
      where: { id: application.leadId },
      data: { pipelineStageId: paymentPendingStageId ?? application.lead.pipelineStageId }
    });
    await tx.leadActivity.create({
      data: {
        leadId: application.leadId,
        actorId: actor.id,
        type: "PAYMENT_REQUESTED",
        summary: total === 0 ? `${application.program.name} marked as no-fee payment request.` : `Payment requested for ${application.program.name}: INR ${total}.`
      }
    });
    if (parsed.data.note?.trim()) {
      await tx.leadNote.create({ data: { leadId: application.leadId, authorId: actor.id, note: parsed.data.note.trim() } });
    }
    return created;
  });

  revalidatePath("/admissions/dashboard");
  revalidatePath("/admissions/action-queue");
  revalidatePath("/admissions/payments");
  revalidatePath(`/admissions/applications/${application.id}`);
  return { ok: true, message: `Payment request ready: ${invoice.invoiceNo}.` };
}

export async function captureManualPaymentAction(_: State, formData: FormData): Promise<State> {
  const actor = await requireAdmissionUser();
  const parsed = manualPaymentCaptureSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check payment details." };

  const invoice = await prisma.feeInvoice.findUnique({ where: { id: parsed.data.invoiceId }, include: { lead: true, program: true, transactions: true } });
  if (!invoice) return { ok: false, message: "Invoice not found." };
  if (invoice.status === "PAID") return { ok: true, message: "This invoice is already paid." };

  const duplicate = await prisma.paymentTransaction.findFirst({
    where: { invoiceId: invoice.id, provider: parsed.data.provider, providerRef: parsed.data.providerRef }
  });
  if (duplicate) return { ok: true, message: "This payment reference is already recorded." };

  const verificationStageId = await stageId("payment-verification-pending");
  await prisma.$transaction(async (tx) => {
    await tx.paymentTransaction.create({
      data: {
        invoiceId: invoice.id,
        provider: parsed.data.provider,
        status: "INITIATED",
        amount: parsed.data.amount,
        providerRef: parsed.data.providerRef,
        paidAt: dateOrNull(parsed.data.paidAt),
        metadata: { verificationStatus: "PENDING", note: parsed.data.note ?? null }
      }
    });
    if (invoice.leadId) {
      await tx.lead.update({
        where: { id: invoice.leadId },
        data: { pipelineStageId: verificationStageId ?? invoice.lead?.pipelineStageId }
      });
      await tx.leadActivity.create({
        data: {
          leadId: invoice.leadId,
          actorId: actor.id,
          type: "PAYMENT_RECEIVED_PENDING_VERIFICATION",
          summary: `Payment received for ${invoice.invoiceNo}: INR ${parsed.data.amount}. Verification pending.`
        }
      });
    }
  });

  revalidatePath("/admissions/action-queue");
  revalidatePath("/admissions/payments");
  return { ok: true, message: "Payment recorded for verification." };
}

export async function verifyPaymentAction(_: State, formData: FormData): Promise<State> {
  const actor = await requireAdmissionUser();
  const parsed = paymentVerificationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check verification details." };

  const payment = await prisma.paymentTransaction.findUnique({
    where: { id: parsed.data.paymentId },
    include: { invoice: { include: { lead: true, program: true, transactions: true } } }
  });
  if (!payment) return { ok: false, message: "Payment not found." };
  if (payment.status === "SUCCESS" && payment.invoice.status === "PAID" && parsed.data.decision === "VERIFIED") return { ok: true, message: "Payment is already verified." };

  const totalVerifiedBefore = payment.invoice.transactions.filter((item) => item.id !== payment.id && item.status === "SUCCESS").reduce((sum, item) => sum + item.amount, 0);
  const nextVerified = parsed.data.decision === "VERIFIED" ? totalVerifiedBefore + payment.amount : totalVerifiedBefore;
  const nextInvoiceStatus = nextVerified >= payment.invoice.total ? "PAID" : nextVerified > 0 ? "PARTIALLY_PAID" : "ISSUED";
  const nextPaymentStatus = parsed.data.decision === "VERIFIED" ? "SUCCESS" : parsed.data.decision === "REFUNDED" ? "REFUNDED" : "FAILED";
  const targetStageId = await stageId(nextInvoiceStatus === "PAID" ? "payment-confirmed" : "payment-pending");

  await prisma.$transaction(async (tx) => {
    await tx.paymentTransaction.update({
      where: { id: payment.id },
      data: {
        status: nextPaymentStatus,
        paidAt: nextPaymentStatus === "SUCCESS" ? payment.paidAt ?? new Date() : payment.paidAt,
        metadata: { verificationStatus: parsed.data.decision, verifiedById: actor.id, verifiedAt: new Date().toISOString(), note: parsed.data.note ?? null }
      }
    });
    await tx.feeInvoice.update({
      where: { id: payment.invoiceId },
      data: { status: nextInvoiceStatus, paidAt: nextInvoiceStatus === "PAID" ? new Date() : null }
    });
    if (payment.invoice.leadId) {
      await tx.lead.update({
        where: { id: payment.invoice.leadId },
        data: { pipelineStageId: targetStageId ?? payment.invoice.lead?.pipelineStageId }
      });
      await tx.leadActivity.create({
        data: {
          leadId: payment.invoice.leadId,
          actorId: actor.id,
          type: nextPaymentStatus === "SUCCESS" ? "PAYMENT_VERIFIED" : "PAYMENT_FAILED",
          summary: nextPaymentStatus === "SUCCESS" ? `Payment verified for ${payment.invoice.invoiceNo}: INR ${payment.amount}.` : `Payment marked ${nextPaymentStatus} for ${payment.invoice.invoiceNo}.`
        }
      });
    }
    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: "PAYMENT_VERIFICATION_DECISION",
        entity: "PaymentTransaction",
        entityId: payment.id,
        metadata: { decision: parsed.data.decision }
      }
    });
  });

  revalidatePath("/admissions/action-queue");
  revalidatePath("/admissions/payments");
  return { ok: true, message: nextPaymentStatus === "SUCCESS" ? "Payment verified." : "Payment updated." };
}

export async function confirmAdmissionAndActivateStudentAction(_: State, formData: FormData): Promise<State> {
  const actor = await requireAdmissionUser();
  const parsed = admissionActivationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check activation details." };

  const application = await prisma.admissionApplication.findUnique({
    where: { id: parsed.data.applicationId },
    include: {
      lead: true,
      program: { include: { journeys: { where: { status: "ACTIVE" }, orderBy: { version: "desc" }, take: 1 } } },
      studentLoginCredentials: { where: { status: "ACTIVE", revokedAt: null }, take: 1 },
      student: true
    }
  });
  if (!application) return { ok: false, message: "Application not found." };
  if (application.status !== "APPROVED") return { ok: false, message: "Approve the application before confirming admission." };

  const invoice = parsed.data.invoiceId
    ? await prisma.feeInvoice.findUnique({ where: { id: parsed.data.invoiceId }, include: { transactions: true } })
    : await prisma.feeInvoice.findFirst({ where: { leadId: application.leadId, programId: application.programId, status: "PAID" }, include: { transactions: true }, orderBy: { updatedAt: "desc" } });

  if (application.program.feeType !== "FREE" && (!invoice || invoice.status !== "PAID")) {
    return { ok: false, message: "Verified payment is required before admission confirmation." };
  }

  const journey = application.program.journeys[0] ?? await prisma.journey.findFirst({ where: { programId: application.programId, status: "ACTIVE" }, orderBy: { version: "desc" } });
  if (!journey) return { ok: false, message: "Create an active journey before activating this student." };

  const whatsapp = normalizeWhatsApp(parsed.data.whatsapp);
  const pin = application.studentLoginCredentials[0] ? null : createSixDigitPin();
  const passwordHash = await hashPassword(createToken(20));
  const pinHash = pin ? await hashPassword(pin) : null;
  const studentEmail = (application.lead.email?.trim().toLowerCase() || `${whatsapp.replace(/\D/g, "")}@aira-skill-city.local`).slice(0, 255);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const onboardingStageId = await stageId(parsed.data.batchId ? "onboarding" : "batch-assignment-pending");

  const result = await prisma.$transaction(async (tx) => {
    const studentRole = await tx.role.upsert({
      where: { name: "Student" },
      update: {},
      create: { name: "Student", description: "Learner account" }
    });

    const existingCredential = await tx.studentLoginCredential.findUnique({ where: { whatsapp } });
    const existingStudent = existingCredential
      ? await tx.user.findUnique({ where: { id: existingCredential.userId } })
      : await tx.user.findUnique({ where: { email: studentEmail } });

    const student = existingStudent
      ? await tx.user.update({ where: { id: existingStudent.id }, data: { name: application.lead.name, status: "ACTIVE" } })
      : await tx.user.create({
          data: {
            name: application.lead.name,
            email: studentEmail,
            passwordHash,
            status: "ACTIVE"
          }
        });

    await tx.userRole.upsert({
      where: { userId_roleId: { userId: student.id, roleId: studentRole.id } },
      update: {},
      create: { userId: student.id, roleId: studentRole.id }
    });

    await tx.admissionApplication.update({
      where: { id: application.id },
      data: { studentId: student.id }
    });

    await tx.studentActivationProfile.upsert({
      where: { studentId: student.id },
      update: {
        whatsapp,
        city: application.lead.city,
        state: application.lead.state
      },
      create: {
        studentId: student.id,
        whatsapp,
        city: application.lead.city,
        state: application.lead.state
      }
    });

    const enrollment = await tx.studentEnrollment.upsert({
      where: { studentId_programId_journeyId: { studentId: student.id, programId: application.programId, journeyId: journey.id } },
      update: { batchId: parsed.data.batchId || null, status: "ACTIVE" },
      create: { studentId: student.id, programId: application.programId, journeyId: journey.id, batchId: parsed.data.batchId || null, status: "ACTIVE" }
    });

    await tx.enrollmentLog.create({
      data: {
        studentId: student.id,
        batchId: parsed.data.batchId || null,
        enrollmentId: enrollment.id,
        action: parsed.data.batchId ? "ADMISSION_CONFIRMED_ENROLLED" : "ADMISSION_CONFIRMED_BATCH_PENDING",
        metadata: { applicationId: application.id, invoiceId: invoice?.id ?? null, actorId: actor.id }
      }
    });

    await tx.lead.update({
      where: { id: application.leadId },
      data: {
        whatsapp,
        status: "WON",
        convertedAt: application.lead.convertedAt ?? new Date(),
        pipelineStageId: onboardingStageId ?? application.lead.pipelineStageId
      }
    });

    let credential = existingCredential;
    if (!credential) {
      credential = await tx.studentLoginCredential.create({
        data: {
          userId: student.id,
          applicationId: application.id,
          whatsapp,
          pinHash: pinHash ?? "",
          expiresAt,
          generatedById: actor.id
        }
      });
    } else if (credential.applicationId !== application.id || credential.userId !== student.id) {
      credential = await tx.studentLoginCredential.update({
        where: { id: credential.id },
        data: { userId: student.id, applicationId: application.id, status: "ACTIVE", revokedAt: null }
      });
    }

    await tx.leadActivity.createMany({
      data: [
        { leadId: application.leadId, actorId: actor.id, type: "ADMISSION_CONFIRMED", summary: `${application.program.name} admission confirmed.` },
        { leadId: application.leadId, actorId: actor.id, type: "STUDENT_ACCOUNT_ACTIVATED", summary: `Student account activated for ${student.email}.` },
        { leadId: application.leadId, actorId: actor.id, type: "ONBOARDING_INITIATED", summary: parsed.data.batchId ? "Onboarding initiated with batch assigned." : "Onboarding initiated. Batch assignment pending." }
      ]
    });

    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: "ADMISSION_CONFIRMED_STUDENT_ACTIVATED",
        entity: "AdmissionApplication",
        entityId: application.id,
        metadata: { studentId: student.id, enrollmentId: enrollment.id, credentialId: credential.id }
      }
    });

    return { student, credential, shouldSendCredential: Boolean(pin), pin };
  });

  if (result.shouldSendCredential && result.pin) {
    const template = approvedAdmissionPinTemplate({ name: result.student.name, whatsapp, pin: result.pin });
    await sendWhatsAppMessage({
      to: whatsapp,
      template: template.template,
      message: template.message,
      applicationId: application.id,
      userId: result.student.id,
      metadata: { credentialId: result.credential.id, programId: application.programId, phase: "admission_activation" }
    });
  }

  revalidatePath("/admissions/dashboard");
  revalidatePath("/admissions/action-queue");
  revalidatePath("/admissions/approved");
  revalidatePath("/admissions/enrollments");
  revalidatePath(`/admissions/applications/${application.id}`);
  return { ok: true, message: result.shouldSendCredential ? "Admission confirmed. Student activated and credentials prepared." : "Admission already confirmed. Student account is active." };
}
