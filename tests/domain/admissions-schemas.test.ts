import { describe, expect, it } from "vitest";
import { admissionProgramSchema, leadSchema } from "@/features/admissions/schemas";
import { manualPaymentCaptureSchema, paymentRequestSchema } from "@/features/admissions/phase4-schemas";

const id = "550e8400-e29b-41d4-a716-446655440000";

describe("admissions validation", () => {
  it("coerces payment form amounts into non-negative integers", () => {
    const result = paymentRequestSchema.parse({
      applicationId: id,
      subtotal: "12000",
      discount: "500",
      scholarship: "1500",
      gst: "1800"
    });

    expect(result).toMatchObject({ subtotal: 12000, discount: 500, scholarship: 1500, gst: 1800 });
  });

  it("rejects a manual payment without a usable provider reference", () => {
    const result = manualPaymentCaptureSchema.safeParse({
      invoiceId: id,
      amount: "1000",
      provider: "MANUAL",
      providerRef: " "
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid lead email addresses", () => {
    const result = leadSchema.safeParse({
      name: "Test Applicant",
      email: "not-an-email",
      phone: "9876543210",
      priority: "MEDIUM"
    });

    expect(result.success).toBe(false);
  });

  it("enforces lowercase URL-safe program slugs", () => {
    const result = admissionProgramSchema.safeParse({
      name: "Startup School",
      slug: "Startup School",
      category: "Entrepreneurship",
      description: "A practical entrepreneurship program.",
      durationDays: "30",
      status: "ACTIVE",
      feeType: "PAID",
      admissionStatus: "OPEN",
      displayOrder: "1"
    });

    expect(result.success).toBe(false);
  });
});
