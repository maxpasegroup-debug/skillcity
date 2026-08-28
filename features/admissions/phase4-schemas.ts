import { z } from "zod";

export const paymentRequestSchema = z.object({
  applicationId: z.string().uuid(),
  subtotal: z.coerce.number().int().min(0),
  discount: z.coerce.number().int().min(0).default(0),
  scholarship: z.coerce.number().int().min(0).default(0),
  gst: z.coerce.number().int().min(0).default(0),
  dueAt: z.string().optional(),
  note: z.string().trim().max(800).optional()
});

export const manualPaymentCaptureSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.coerce.number().int().positive(),
  provider: z.enum(["MANUAL", "RAZORPAY", "STRIPE", "SCHOLARSHIP"]).default("MANUAL"),
  providerRef: z.string().trim().min(2, "Reference number is required.").max(160),
  paidAt: z.string().optional(),
  note: z.string().trim().max(800).optional()
});

export const paymentVerificationSchema = z.object({
  paymentId: z.string().uuid(),
  decision: z.enum(["VERIFIED", "FAILED", "REFUNDED"]),
  note: z.string().trim().max(800).optional()
});

export const admissionActivationSchema = z.object({
  applicationId: z.string().uuid(),
  invoiceId: z.string().uuid().optional().or(z.literal("")),
  batchId: z.string().uuid().optional().or(z.literal("")),
  whatsapp: z.string().trim().min(7, "Enter a valid WhatsApp number.").max(40)
});
