import { z } from "zod";
import { COMPLIANCE_STATUSES, COMPLIANCE_SUBJECT_TYPES, CORE_DOCUMENT_CATEGORIES, DOCUMENT_ACCESS_POLICIES, DOCUMENT_CONTEXT_TYPES, INVOICE_STATUSES } from "@/lib/core-operations/policies";

const optionalUuid = z.string().uuid().optional().or(z.literal(""));
const optionalDate = z.string().optional().or(z.literal("")).refine((value) => !value || !Number.isNaN(Date.parse(value)), "Enter a valid date.");
const organizationPath = {
  institutionId: z.string().uuid(),
  divisionId: optionalUuid,
  districtId: optionalUuid,
  campusId: optionalUuid,
  departmentId: optionalUuid
};

const documentVersionFields = {
  originalFilename: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(3).max(160),
  sizeBytes: z.coerce.number().int().positive().max(2_147_483_647).optional().or(z.literal("")),
  storageProvider: z.string().trim().min(2).max(80),
  storageKey: z.string().trim().min(3).max(700),
  checksum: z.string().trim().max(160).optional().or(z.literal(""))
};

export const coreDocumentSchema = z.object({
  ...organizationPath,
  code: z.string().trim().min(2).max(100),
  displayName: z.string().trim().min(2).max(220),
  category: z.enum(CORE_DOCUMENT_CATEGORIES),
  accessPolicy: z.enum(DOCUMENT_ACCESS_POLICIES),
  ...documentVersionFields,
  contextType: z.enum(DOCUMENT_CONTEXT_TYPES).optional().or(z.literal("")),
  contextId: z.string().trim().max(140).optional().or(z.literal("")),
  retentionUntil: optionalDate
}).refine((value) => Boolean(value.contextType) === Boolean(value.contextId), { message: "Document context type and reference must be provided together." });

export const documentVersionSchema = z.object({ documentId: z.string().uuid(), ...documentVersionFields });
export const archiveDocumentSchema = z.object({ documentId: z.string().uuid() });

export const complianceRecordSchema = z.object({
  ...organizationPath,
  code: z.string().trim().min(2).max(100),
  title: z.string().trim().min(2).max(220),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  subjectType: z.enum(COMPLIANCE_SUBJECT_TYPES),
  subjectId: z.string().trim().max(140).optional().or(z.literal("")),
  responsibleEmployeeId: optionalUuid,
  reviewerEmployeeId: optionalUuid,
  effectiveAt: optionalDate,
  expiresAt: optionalDate,
  reviewAt: optionalDate
}).refine((value) => value.subjectType === "ORGANIZATION" || Boolean(value.subjectId), { message: "A subject reference is required for this compliance type." })
  .refine((value) => !value.effectiveAt || !value.expiresAt || new Date(value.expiresAt) > new Date(value.effectiveAt), { message: "Expiry must be after the effective date." });

export const complianceStatusSchema = z.object({ complianceRecordId: z.string().uuid(), status: z.enum(COMPLIANCE_STATUSES) });
export const complianceDocumentSchema = z.object({ complianceRecordId: z.string().uuid(), documentId: z.string().uuid(), required: z.enum(["true", "false"]).default("true") });

export const financeInvoiceSchema = z.object({
  programId: z.string().uuid(),
  customerUserId: optionalUuid,
  invoiceNo: z.string().trim().min(2).max(80),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Use a three-letter currency code."),
  reference: z.string().trim().max(180).optional().or(z.literal("")),
  subtotal: z.coerce.number().int().positive(),
  discount: z.coerce.number().int().nonnegative().default(0),
  tax: z.coerce.number().int().nonnegative().default(0),
  dueAt: optionalDate
});

export const invoiceStatusSchema = z.object({ invoiceId: z.string().uuid(), status: z.enum(INVOICE_STATUSES) });
export const financePaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  provider: z.enum(["RAZORPAY", "STRIPE", "MANUAL", "SCHOLARSHIP"]),
  amount: z.coerce.number().int().positive(),
  providerRef: z.string().trim().min(2).max(160),
  paidAt: optionalDate
});
export const financePaymentVerificationSchema = z.object({ paymentId: z.string().uuid(), decision: z.enum(["VERIFIED", "REJECTED"]) });
