import { z } from "zod";

export const labsCommercialDocumentSchema = z.object({
  number: z.string().trim().min(2).max(80).regex(/^[A-Za-z0-9/_-]+$/, "Use letters, numbers, slash or hyphen"),
  type: z.enum(["QUOTATION", "INVOICE"]),
  service: z.enum(["AI_POWERED_SIGNATURE_OS", "TALKIN_LABS", "CUSTOM"]),
  customerName: z.string().trim().min(2).max(180),
  customerPhone: z.string().trim().max(40).optional().or(z.literal("")),
  customerEmail: z.string().trim().email().optional().or(z.literal("")),
  customerAddress: z.string().trim().max(1200).optional().or(z.literal("")),
  customerGstin: z.string().trim().max(30).optional().or(z.literal("")),
  issuerAddress: z.string().trim().max(1200).optional().or(z.literal("")),
  issuerGstin: z.string().trim().max(30).optional().or(z.literal("")),
  description: z.string().trim().min(2).max(2000),
  quantity: z.coerce.number().positive().max(100000),
  unitPrice: z.coerce.number().nonnegative().max(100000000),
  gstApplicable: z.enum(["on"]).optional(),
  gstRate: z.coerce.number().min(0).max(100).default(18),
  validUntil: z.string().optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal(""))
});

export function calculateLabsCommercialAmounts(input: { quantity: number; unitPrice: number; gstApplicable: boolean; gstRate: number }) {
  const subtotal = Math.round(input.quantity * input.unitPrice * 100) / 100;
  const gstAmount = input.gstApplicable ? Math.round(subtotal * input.gstRate) / 100 : 0;
  return { subtotal, gstAmount, total: Math.round((subtotal + gstAmount) * 100) / 100 };
}
