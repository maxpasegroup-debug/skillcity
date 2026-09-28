"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, type AuthorizationUser, type PermissionKey } from "@/lib/auth/permissions";
import { calculateInvoiceTotal, canTransitionComplianceStatus, canTransitionInvoiceStatus, normalizeRecordCode, outstandingInvoiceAmount } from "@/lib/core-operations/policies";
import { archiveDocumentSchema, complianceDocumentSchema, complianceRecordSchema, complianceStatusSchema, coreDocumentSchema, documentVersionSchema, financeInvoiceSchema, financePaymentSchema, financePaymentVerificationSchema, invoiceStatusSchema } from "@/features/core-operations/schemas";
import { assertPermission, AuthorizationError } from "@/server/auth/authorization";
import { assertApplicationAccess, assertCareerEmployerAccess, assertCareerOpportunityAccess, assertComplianceRecordAccess, assertCoreDocumentAccess, assertEmployeeAccess, assertInstitutionAccess, assertInvoiceAccess, assertLabsProductAccess, assertPaymentAccess, assertProgramAccess, assertStudentAccess } from "@/server/auth/resource-access";
import { employeeScopeWhere } from "@/server/auth/scoping";
import { validateOrganizationPathForActor } from "@/server/organization/service";

export type CoreActionState = { ok: boolean; message: string; id?: string };
type OrganizationPath = { institutionId: string; divisionId?: string | null; districtId?: string | null; campusId?: string | null; departmentId?: string | null };

const failure = (message: string): CoreActionState => ({ ok: false, message });
const optional = (value?: string) => value || null;
const date = (value?: string) => value ? new Date(value) : null;

function assignmentCoversPath(assignment: OrganizationPath, path: OrganizationPath) {
  return assignment.institutionId === path.institutionId &&
    (!path.divisionId || assignment.divisionId === path.divisionId) &&
    (!path.districtId || assignment.districtId === path.districtId) &&
    (!path.campusId || assignment.campusId === path.campusId) &&
    (!path.departmentId || assignment.departmentId === path.departmentId);
}

async function eligibleEmployee(actor: AuthorizationUser, permission: PermissionKey, employeeId: string, path: OrganizationPath) {
  await assertEmployeeAccess(actor, permission, employeeId);
  const now = new Date();
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, AND: [employeeScopeWhere(actor, permission), { status: { in: ["ACTIVE", "PROBATION", "ON_NOTICE"] } }] },
    include: { organizationAssignments: { where: { startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] } } }
  });
  if (!employee || ![employee, ...employee.organizationAssignments].some((assignment) => assignment.institutionId && assignmentCoversPath(assignment as OrganizationPath, path))) {
    throw new AuthorizationError("Employee must be active and assigned to the same organization scope");
  }
  return employee;
}

async function assertDocumentContext(actor: AuthorizationUser, type: string, id: string) {
  if (type === "EMPLOYEE") return assertEmployeeAccess(actor, PERMISSIONS.DOCUMENTS_MANAGE, id);
  if (type === "STUDENT") return assertStudentAccess(actor, PERMISSIONS.DOCUMENTS_MANAGE, id);
  if (type === "APPLICATION") return assertApplicationAccess(actor, PERMISSIONS.DOCUMENTS_MANAGE, id);
  if (type === "INVOICE") return assertInvoiceAccess(actor, PERMISSIONS.DOCUMENTS_MANAGE, id);
  if (type === "COMPLIANCE") return assertComplianceRecordAccess(actor, PERMISSIONS.DOCUMENTS_MANAGE, id);
  if (type === "ORGANIZATION") return assertInstitutionAccess(actor, PERMISSIONS.DOCUMENTS_MANAGE, id);
  if (type === "CAREER_OPPORTUNITY") return assertCareerOpportunityAccess(actor, PERMISSIONS.DOCUMENTS_MANAGE, id);
  if (type === "LABS_PRODUCT") return assertLabsProductAccess(actor, PERMISSIONS.DOCUMENTS_MANAGE, id);
  if (type === "PROGRAM") return assertProgramAccess(actor, PERMISSIONS.DOCUMENTS_MANAGE, id);
  throw new AuthorizationError("Unsupported document context");
}

export async function createCoreDocumentAction(_: CoreActionState, formData: FormData): Promise<CoreActionState> {
  const actor = await assertPermission(PERMISSIONS.DOCUMENTS_MANAGE);
  const parsed = coreDocumentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Check document metadata.");
  const data = parsed.data;
  const path = { institutionId: data.institutionId, divisionId: optional(data.divisionId), districtId: optional(data.districtId), campusId: optional(data.campusId), departmentId: optional(data.departmentId) };
  await validateOrganizationPathForActor(actor, PERMISSIONS.DOCUMENTS_MANAGE, path);
  if (data.contextType && data.contextId) await assertDocumentContext(actor, data.contextType, data.contextId);
  const code = normalizeRecordCode(data.code);
  try {
    const document = await prisma.$transaction(async (tx) => {
      const created = await tx.coreDocument.create({
        data: { ...path, code, displayName: data.displayName, category: data.category, accessPolicy: data.accessPolicy, ownerUserId: actor.id, retentionUntil: date(data.retentionUntil), createdById: actor.id }
      });
      await tx.coreDocumentVersion.create({ data: { documentId: created.id, version: 1, originalFilename: data.originalFilename, mimeType: data.mimeType, sizeBytes: data.sizeBytes === "" ? null : data.sizeBytes, storageProvider: data.storageProvider, storageKey: data.storageKey, checksum: optional(data.checksum), uploadedById: actor.id } });
      if (data.contextType && data.contextId) await tx.coreDocumentContextLink.create({ data: { documentId: created.id, contextType: data.contextType, contextId: data.contextId } });
      await tx.platformAudit.create({ data: { actorId: actor.id, action: "CORE_DOCUMENT_CREATED", entity: "CoreDocument", entityId: created.id, metadata: { code, category: data.category, accessPolicy: data.accessPolicy } } });
      return created;
    });
    revalidatePath("/documents");
    return { ok: true, message: "Document metadata registered.", id: document.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return failure("Document code is already in use.");
    throw error;
  }
}

export async function addCoreDocumentVersionAction(_: CoreActionState, formData: FormData): Promise<CoreActionState> {
  const actor = await assertPermission(PERMISSIONS.DOCUMENTS_MANAGE);
  const parsed = documentVersionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Check document version metadata.");
  await assertCoreDocumentAccess(actor, PERMISSIONS.DOCUMENTS_MANAGE, parsed.data.documentId);
  const created = await prisma.$transaction(async (tx) => {
    const latest = await tx.coreDocumentVersion.findFirst({ where: { documentId: parsed.data.documentId }, orderBy: { version: "desc" }, select: { version: true } });
    const version = await tx.coreDocumentVersion.create({ data: { documentId: parsed.data.documentId, version: (latest?.version ?? 0) + 1, originalFilename: parsed.data.originalFilename, mimeType: parsed.data.mimeType, sizeBytes: parsed.data.sizeBytes === "" ? null : parsed.data.sizeBytes, storageProvider: parsed.data.storageProvider, storageKey: parsed.data.storageKey, checksum: optional(parsed.data.checksum), uploadedById: actor.id } });
    await tx.platformAudit.create({ data: { actorId: actor.id, action: "CORE_DOCUMENT_VERSION_CREATED", entity: "CoreDocument", entityId: parsed.data.documentId, metadata: { version: version.version } } });
    return version;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  revalidatePath(`/documents/${parsed.data.documentId}`);
  return { ok: true, message: `Document version ${created.version} registered.` };
}

export async function archiveCoreDocumentAction(_: CoreActionState, formData: FormData): Promise<CoreActionState> {
  const actor = await assertPermission(PERMISSIONS.DOCUMENTS_MANAGE);
  const parsed = archiveDocumentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Invalid document.");
  await assertCoreDocumentAccess(actor, PERMISSIONS.DOCUMENTS_MANAGE, parsed.data.documentId);
  await prisma.$transaction([
    prisma.coreDocument.update({ where: { id: parsed.data.documentId }, data: { status: "ARCHIVED", archivedAt: new Date() } }),
    prisma.platformAudit.create({ data: { actorId: actor.id, action: "CORE_DOCUMENT_ARCHIVED", entity: "CoreDocument", entityId: parsed.data.documentId } })
  ]);
  revalidatePath("/documents");
  return { ok: true, message: "Document archived without deleting history." };
}

async function assertComplianceSubject(actor: AuthorizationUser, type: string, id: string | undefined) {
  if (type === "ORGANIZATION") return;
  if (!id) throw new AuthorizationError("Compliance subject is required");
  if (type === "EMPLOYEE") return assertEmployeeAccess(actor, PERMISSIONS.COMPLIANCE_MANAGE, id);
  if (type === "STUDENT") return assertStudentAccess(actor, PERMISSIONS.COMPLIANCE_MANAGE, id);
  if (type === "EMPLOYER") return assertCareerEmployerAccess(actor, PERMISSIONS.COMPLIANCE_MANAGE, id);
  if (type === "PROGRAM") return assertProgramAccess(actor, PERMISSIONS.COMPLIANCE_MANAGE, id);
  if (type === "DOCUMENT") return assertCoreDocumentAccess(actor, PERMISSIONS.COMPLIANCE_MANAGE, id);
  if (type === "OTHER") return;
  throw new AuthorizationError("Unsupported compliance subject");
}

export async function createComplianceRecordAction(_: CoreActionState, formData: FormData): Promise<CoreActionState> {
  const actor = await assertPermission(PERMISSIONS.COMPLIANCE_MANAGE);
  const parsed = complianceRecordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Check compliance details.");
  const data = parsed.data;
  const path = { institutionId: data.institutionId, divisionId: optional(data.divisionId), districtId: optional(data.districtId), campusId: optional(data.campusId), departmentId: optional(data.departmentId) };
  await validateOrganizationPathForActor(actor, PERMISSIONS.COMPLIANCE_MANAGE, path);
  await assertComplianceSubject(actor, data.subjectType, data.subjectId || (data.subjectType === "ORGANIZATION" ? data.institutionId : undefined));
  if (data.responsibleEmployeeId) await eligibleEmployee(actor, PERMISSIONS.COMPLIANCE_MANAGE, data.responsibleEmployeeId, path);
  if (data.reviewerEmployeeId) await eligibleEmployee(actor, PERMISSIONS.COMPLIANCE_MANAGE, data.reviewerEmployeeId, path);
  const code = normalizeRecordCode(data.code);
  try {
    const record = await prisma.$transaction(async (tx) => {
      const created = await tx.complianceRecord.create({ data: { ...path, code, title: data.title, description: optional(data.description), subjectType: data.subjectType, subjectId: data.subjectType === "ORGANIZATION" ? data.institutionId : optional(data.subjectId), responsibleEmployeeId: optional(data.responsibleEmployeeId), reviewerEmployeeId: optional(data.reviewerEmployeeId), effectiveAt: date(data.effectiveAt), expiresAt: date(data.expiresAt), reviewAt: date(data.reviewAt), createdById: actor.id } });
      await tx.platformAudit.create({ data: { actorId: actor.id, action: "COMPLIANCE_RECORD_CREATED", entity: "ComplianceRecord", entityId: created.id, metadata: { code, subjectType: data.subjectType } } });
      return created;
    });
    revalidatePath("/compliance");
    return { ok: true, message: "Compliance record created.", id: record.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return failure("Compliance code is already in use.");
    throw error;
  }
}

export async function updateComplianceStatusAction(_: CoreActionState, formData: FormData): Promise<CoreActionState> {
  const actor = await assertPermission(PERMISSIONS.COMPLIANCE_MANAGE);
  const parsed = complianceStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Invalid compliance status.");
  await assertComplianceRecordAccess(actor, PERMISSIONS.COMPLIANCE_MANAGE, parsed.data.complianceRecordId);
  const current = await prisma.complianceRecord.findUniqueOrThrow({ where: { id: parsed.data.complianceRecordId } });
  if (!canTransitionComplianceStatus(current.status, parsed.data.status)) return failure(`Cannot move compliance from ${current.status} to ${parsed.data.status}.`);
  await prisma.$transaction([
    prisma.complianceRecord.update({ where: { id: current.id }, data: { status: parsed.data.status, reviewedAt: parsed.data.status === "ACTIVE" || parsed.data.status === "REJECTED" ? new Date() : current.reviewedAt, archivedAt: parsed.data.status === "ARCHIVED" ? new Date() : null } }),
    prisma.platformAudit.create({ data: { actorId: actor.id, action: "COMPLIANCE_STATUS_CHANGED", entity: "ComplianceRecord", entityId: current.id, metadata: { from: current.status, to: parsed.data.status } } })
  ]);
  revalidatePath("/compliance");
  return { ok: true, message: "Compliance status updated." };
}

export async function attachComplianceDocumentAction(_: CoreActionState, formData: FormData): Promise<CoreActionState> {
  const actor = await assertPermission(PERMISSIONS.COMPLIANCE_MANAGE);
  const parsed = complianceDocumentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Choose a valid compliance record and document.");
  await assertComplianceRecordAccess(actor, PERMISSIONS.COMPLIANCE_MANAGE, parsed.data.complianceRecordId);
  await assertCoreDocumentAccess(actor, PERMISSIONS.DOCUMENTS_READ, parsed.data.documentId);
  const [record, document] = await Promise.all([prisma.complianceRecord.findUniqueOrThrow({ where: { id: parsed.data.complianceRecordId } }), prisma.coreDocument.findUniqueOrThrow({ where: { id: parsed.data.documentId } })]);
  if (record.institutionId !== document.institutionId) throw new AuthorizationError("Document and compliance record must belong to the same organization");
  const link = await prisma.complianceDocument.upsert({ where: { complianceRecordId_documentId: { complianceRecordId: record.id, documentId: document.id } }, update: { required: parsed.data.required === "true" }, create: { complianceRecordId: record.id, documentId: document.id, required: parsed.data.required === "true" } });
  await prisma.platformAudit.create({ data: { actorId: actor.id, action: "COMPLIANCE_DOCUMENT_ATTACHED", entity: "ComplianceDocument", entityId: link.id, metadata: { complianceRecordId: record.id, documentId: document.id } } });
  revalidatePath("/compliance");
  return { ok: true, message: "Document attached to compliance record." };
}

export async function createFinanceInvoiceAction(_: CoreActionState, formData: FormData): Promise<CoreActionState> {
  const actor = await assertPermission(PERMISSIONS.FINANCE_INVOICE_MANAGE);
  const parsed = financeInvoiceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Check invoice details.");
  const data = parsed.data;
  await assertProgramAccess(actor, PERMISSIONS.FINANCE_INVOICE_MANAGE, data.programId);
  const program = await prisma.program.findUnique({ where: { id: data.programId }, include: { division: true, campus: true, department: true } });
  const institutionId = program?.institutionId ?? program?.division?.institutionId ?? program?.campus?.institutionId ?? program?.department?.institutionId;
  if (!program || !institutionId) return failure("Program must have an authoritative organization before invoicing.");
  if (data.customerUserId) {
    const customer = await prisma.user.findFirst({ where: { id: data.customerUserId, enrollments: { some: { programId: program.id } } }, select: { id: true } });
    if (!customer) throw new AuthorizationError("Invoice customer must be enrolled in the selected program");
  }
  const total = calculateInvoiceTotal({ subtotal: data.subtotal, discount: data.discount, tax: data.tax });
  if (total <= 0) return failure("Invoice total must be greater than zero.");
  try {
    const invoice = await prisma.$transaction(async (tx) => {
      const created = await tx.feeInvoice.create({ data: { studentId: optional(data.customerUserId), programId: program.id, institutionId, divisionId: program.divisionId, districtId: program.campus?.districtId ?? null, campusId: program.campusId, departmentId: program.departmentId, createdById: actor.id, invoiceNo: normalizeRecordCode(data.invoiceNo), currency: data.currency, reference: optional(data.reference), subtotal: data.subtotal, discount: data.discount, gst: data.tax, total, status: "DRAFT", dueAt: date(data.dueAt) } });
      await tx.platformAudit.create({ data: { actorId: actor.id, action: "FINANCE_INVOICE_CREATED", entity: "FeeInvoice", entityId: created.id, metadata: { invoiceNo: created.invoiceNo, currency: created.currency, total: created.total } } });
      return created;
    });
    revalidatePath("/finance/invoices");
    return { ok: true, message: "Draft invoice created.", id: invoice.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return failure("Invoice number is already in use.");
    throw error;
  }
}

export async function updateFinanceInvoiceStatusAction(_: CoreActionState, formData: FormData): Promise<CoreActionState> {
  const actor = await assertPermission(PERMISSIONS.FINANCE_INVOICE_MANAGE);
  const parsed = invoiceStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Invalid invoice status.");
  if (["PARTIALLY_PAID", "PAID"].includes(parsed.data.status)) return failure("Paid states are derived from verified payments.");
  await assertInvoiceAccess(actor, PERMISSIONS.FINANCE_INVOICE_MANAGE, parsed.data.invoiceId);
  const invoice = await prisma.feeInvoice.findUniqueOrThrow({ where: { id: parsed.data.invoiceId } });
  if (!canTransitionInvoiceStatus(invoice.status, parsed.data.status)) return failure(`Cannot move invoice from ${invoice.status} to ${parsed.data.status}.`);
  await prisma.$transaction([
    prisma.feeInvoice.update({ where: { id: invoice.id }, data: { status: parsed.data.status, issuedAt: parsed.data.status === "ISSUED" ? invoice.issuedAt ?? new Date() : invoice.issuedAt, cancelledAt: parsed.data.status === "VOID" || parsed.data.status === "CANCELLED" ? new Date() : null } }),
    prisma.platformAudit.create({ data: { actorId: actor.id, action: "FINANCE_INVOICE_STATUS_CHANGED", entity: "FeeInvoice", entityId: invoice.id, metadata: { from: invoice.status, to: parsed.data.status } } })
  ]);
  revalidatePath("/finance/invoices");
  return { ok: true, message: "Invoice status updated." };
}

export async function recordFinancePaymentAction(_: CoreActionState, formData: FormData): Promise<CoreActionState> {
  const actor = await assertPermission(PERMISSIONS.FINANCE_PAYMENT_MANAGE);
  const parsed = financePaymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Check payment details.");
  await assertInvoiceAccess(actor, PERMISSIONS.FINANCE_PAYMENT_MANAGE, parsed.data.invoiceId);
  const invoice = await prisma.feeInvoice.findUnique({ where: { id: parsed.data.invoiceId }, include: { transactions: true } });
  if (!invoice || !["ISSUED", "PARTIALLY_PAID", "OVERDUE"].includes(invoice.status)) return failure("Only an issued payable invoice can receive a payment.");
  if (parsed.data.amount > outstandingInvoiceAmount(invoice)) return failure("Payment amount exceeds the invoice balance.");
  const duplicate = await prisma.paymentTransaction.findFirst({ where: { provider: parsed.data.provider, providerRef: parsed.data.providerRef } });
  if (duplicate) return failure("This provider payment reference is already recorded.");
  const payment = await prisma.$transaction(async (tx) => {
    const created = await tx.paymentTransaction.create({ data: { invoiceId: invoice.id, studentId: invoice.studentId, provider: parsed.data.provider, status: "INITIATED", amount: parsed.data.amount, providerRef: parsed.data.providerRef, paidAt: date(parsed.data.paidAt), recordedById: actor.id, metadata: { verificationStatus: "PENDING" } } });
    await tx.platformAudit.create({ data: { actorId: actor.id, action: "FINANCE_PAYMENT_RECORDED", entity: "PaymentTransaction", entityId: created.id, metadata: { invoiceId: invoice.id, provider: created.provider, amount: created.amount } } });
    return created;
  });
  revalidatePath("/finance/payments");
  return { ok: true, message: "Payment recorded for verification.", id: payment.id };
}

export async function verifyFinancePaymentAction(_: CoreActionState, formData: FormData): Promise<CoreActionState> {
  const actor = await assertPermission(PERMISSIONS.FINANCE_PAYMENT_MANAGE);
  const parsed = financePaymentVerificationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Invalid payment decision.");
  await assertPaymentAccess(actor, PERMISSIONS.FINANCE_PAYMENT_MANAGE, parsed.data.paymentId);
  await prisma.$transaction(async (tx) => {
    const payment = await tx.paymentTransaction.findUnique({ where: { id: parsed.data.paymentId }, include: { invoice: { include: { transactions: true } } } });
    if (!payment) throw new AuthorizationError("Payment not found");
    if (payment.status !== "INITIATED") throw new AuthorizationError("Payment already has a final verification decision");
    const nextPaymentStatus = parsed.data.decision === "VERIFIED" ? "SUCCESS" : "FAILED";
    const otherPaid = payment.invoice.transactions.filter((item) => item.id !== payment.id && item.status === "SUCCESS").reduce((sum, item) => sum + item.amount, 0);
    const verifiedTotal = otherPaid + (nextPaymentStatus === "SUCCESS" ? payment.amount : 0);
    const nextInvoiceStatus = verifiedTotal >= payment.invoice.total ? "PAID" : verifiedTotal > 0 ? "PARTIALLY_PAID" : payment.invoice.status === "OVERDUE" ? "OVERDUE" : "ISSUED";
    await tx.paymentTransaction.update({ where: { id: payment.id }, data: { status: nextPaymentStatus, verifiedById: actor.id, verifiedAt: new Date(), paidAt: nextPaymentStatus === "SUCCESS" ? payment.paidAt ?? new Date() : payment.paidAt, metadata: { verificationStatus: parsed.data.decision } } });
    await tx.feeInvoice.update({ where: { id: payment.invoiceId }, data: { status: nextInvoiceStatus, paidAt: nextInvoiceStatus === "PAID" ? new Date() : null } });
    await tx.platformAudit.create({ data: { actorId: actor.id, action: "FINANCE_PAYMENT_VERIFIED", entity: "PaymentTransaction", entityId: payment.id, metadata: { decision: parsed.data.decision, invoiceStatus: nextInvoiceStatus } } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  revalidatePath("/finance/payments");
  revalidatePath("/finance/invoices");
  return { ok: true, message: parsed.data.decision === "VERIFIED" ? "Payment verified." : "Payment rejected." };
}
