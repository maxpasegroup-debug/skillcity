import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().min(2).max(160),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(7).max(40),
  whatsapp: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  programInterestedId: z.string().uuid().optional().or(z.literal("")),
  sourceId: z.string().uuid().optional().or(z.literal("")),
  assignedToId: z.string().uuid().optional().or(z.literal("")),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  notes: z.string().optional()
});

export const counsellingSchema = z.object({
  leadId: z.string().uuid(),
  batchId: z.string().uuid().optional().or(z.literal("")),
  scheduledAt: z.string().min(1),
  outcome: z.enum(["SCHEDULED", "ATTENDED", "NO_SHOW", "RESCHEDULED", "CONVERTED", "NOT_INTERESTED"]),
  notes: z.string().optional(),
  nextFollowUpAt: z.string().optional(),
  meetingLink: z.string().url().optional().or(z.literal(""))
});

export const applicationSchema = z.object({
  leadId: z.string().uuid(),
  programId: z.string().uuid(),
  status: z.enum(["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"])
});

export const documentSchema = z.object({
  applicationId: z.string().uuid().optional().or(z.literal("")),
  studentId: z.string().uuid().optional().or(z.literal("")),
  type: z.enum(["ID", "PHOTO", "CERTIFICATE", "ADDRESS_PROOF", "OTHER"]),
  title: z.string().min(2).max(180),
  fileUrl: z.string().url(),
  status: z.enum(["PENDING", "VERIFIED", "REJECTED"]),
  rejectionReason: z.string().optional()
});

export const invoiceSchema = z.object({
  leadId: z.string().uuid().optional().or(z.literal("")),
  studentId: z.string().uuid().optional().or(z.literal("")),
  programId: z.string().uuid().optional().or(z.literal("")),
  batchId: z.string().uuid().optional().or(z.literal("")),
  subtotal: z.coerce.number().int().min(0),
  discount: z.coerce.number().int().min(0).default(0),
  scholarship: z.coerce.number().int().min(0).default(0),
  gst: z.coerce.number().int().min(0).default(0),
  dueAt: z.string().optional()
});

export const paymentSchema = z.object({
  invoiceId: z.string().uuid(),
  provider: z.enum(["RAZORPAY", "STRIPE", "MANUAL", "SCHOLARSHIP"]),
  amount: z.coerce.number().int().positive(),
  status: z.enum(["INITIATED", "SUCCESS", "FAILED", "REFUNDED"]),
  providerRef: z.string().optional()
});

export const commissionSchema = z.object({
  userId: z.string().uuid(),
  programId: z.string().uuid().optional().or(z.literal("")),
  invoiceId: z.string().uuid().optional().or(z.literal("")),
  type: z.enum(["FIXED", "PERCENTAGE", "PROGRAM", "REFERRAL", "MANUAL_ADJUSTMENT"]),
  baseAmount: z.coerce.number().int().min(0),
  rate: z.coerce.number().int().min(0).optional().or(z.literal("")),
  amount: z.coerce.number().int().min(0),
  notes: z.string().optional()
});

export const communicationSchema = z.object({
  leadId: z.string().uuid().optional().or(z.literal("")),
  channel: z.enum(["EMAIL", "SMS", "WHATSAPP", "INTERNAL_NOTIFICATION"]),
  status: z.enum(["DRAFT", "SCHEDULED", "SENT"]),
  subject: z.string().optional(),
  message: z.string().min(2),
  scheduledAt: z.string().optional()
});
