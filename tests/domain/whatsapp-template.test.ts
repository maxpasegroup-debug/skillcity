import { describe, expect, it } from "vitest";
import { approvedAdmissionPinTemplate } from "@/server/whatsapp/templates";

describe("admission WhatsApp template", () => {
  it("produces the approved template key and required login details", () => {
    const result = approvedAdmissionPinTemplate({
      name: "Test Student",
      whatsapp: "+919876543210",
      pin: "123456"
    });

    expect(result.template).toBe("approved_admission_pin");
    expect(result.message).toContain("Test Student");
    expect(result.message).toContain("+919876543210");
    expect(result.message).toContain("123456");
    expect(result.message).toContain("reset your PIN");
  });
});
