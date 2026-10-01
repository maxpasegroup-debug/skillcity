import { describe, expect, it } from "vitest";
import { calculateLabsCommercialAmounts, labsCommercialDocumentSchema } from "@/features/labs/commercial";

describe("AIRA Labs commercial documents", () => {
  it("creates a GST-inclusive total when requested", () => {
    expect(calculateLabsCommercialAmounts({ quantity: 2, unitPrice: 5000, gstApplicable: true, gstRate: 18 })).toEqual({ subtotal: 10000, gstAmount: 1800, total: 11800 });
  });

  it("keeps non-GST documents tax free", () => {
    expect(calculateLabsCommercialAmounts({ quantity: 1, unitPrice: 7250.5, gstApplicable: false, gstRate: 18 })).toEqual({ subtotal: 7250.5, gstAmount: 0, total: 7250.5 });
  });

  it("accepts the two planned services and a custom amount", () => {
    const base = { number: "AL/Q/2026/001", type: "QUOTATION", customerName: "Customer", description: "Custom scope", quantity: "1", unitPrice: "25000", gstRate: "18" };
    expect(labsCommercialDocumentSchema.safeParse({ ...base, service: "AI_POWERED_SIGNATURE_OS" }).success).toBe(true);
    expect(labsCommercialDocumentSchema.safeParse({ ...base, service: "TALKIN_LABS" }).success).toBe(true);
  });
});
