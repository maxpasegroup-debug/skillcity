"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/security/password";
import { createToken } from "@/lib/security/token";
import { requireAdmissionUser, requireBdmUser, ensureDefaultPipeline } from "@/server/admissions/queries";
import { applicationSchema, commissionSchema, communicationSchema, counsellingSchema, documentSchema, invoiceSchema, leadSchema, paymentSchema } from "@/features/admissions/schemas";

type State = { ok: boolean; message: string };

function emptyToNull(value: string | undefined) { return value && value.trim() ? value : null; }
function dateOrNull(value: string | undefined) { return value ? new Date(value) : null; }

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
