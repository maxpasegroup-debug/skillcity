import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createLog: vi.fn(),
  updateLog: vi.fn(),
  send: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    whatsAppMessageLog: {
      create: mocks.createLog,
      update: mocks.updateLog
    }
  }
}));

vi.mock("@/server/whatsapp/provider", () => ({
  getWhatsAppProvider: () => ({ send: mocks.send })
}));

import { sendWhatsAppMessage } from "@/server/whatsapp/service";

describe("WhatsApp service integration boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists the queue before provider delivery metadata", async () => {
    mocks.send.mockResolvedValue({ status: "SENT", provider: "TEST", providerRef: "msg-123" });
    mocks.createLog.mockResolvedValue({ id: "log-123" });
    mocks.updateLog.mockImplementation(async ({ data }) => ({ id: "log-123", ...data }));

    const result = await sendWhatsAppMessage({
      to: "+919876543210",
      template: "approved_admission_pin",
      message: "Test message",
      applicationId: id,
      metadata: { source: "test" }
    });

    expect(mocks.send).toHaveBeenCalledWith({
      to: "+919876543210",
      template: "approved_admission_pin",
      message: "Test message"
    });
    expect(mocks.createLog).toHaveBeenCalledWith({ data: expect.objectContaining({ status: "QUEUED", provider: "PENDING", message: "[REDACTED: admission credential]" }) });
    expect(mocks.updateLog).toHaveBeenCalledWith({
      where: { id: "log-123" },
      data: expect.objectContaining({
        status: "SENT",
        provider: "TEST",
        providerRef: "msg-123",
        sentAt: expect.any(Date)
      })
    });
    expect(result.id).toBe("log-123");
  });

  it("never stores a mobile reset OTP in message logs", async () => {
    mocks.send.mockResolvedValue({ status: "QUEUED", provider: "TEST" });
    mocks.createLog.mockResolvedValue({ id: "log-otp" });
    mocks.updateLog.mockImplementation(async ({ data }) => ({ id: "log-otp", ...data }));
    await sendWhatsAppMessage({ to: "8089239823", template: "mobile_pin_reset_otp", message: "Your OTP is 123456", userId: id });
    expect(mocks.createLog).toHaveBeenCalledWith({ data: expect.objectContaining({ message: "[REDACTED: authentication credential]" }) });
  });
});

const id = "550e8400-e29b-41d4-a716-446655440000";
