import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ find: vi.fn(), findFirst: vi.fn(), update: vi.fn(), audit: vi.fn(), sendEmail: vi.fn(), sendWhatsApp: vi.fn() }));

vi.mock("@/lib/prisma", () => ({ prisma: { communicationMessage: { findUniqueOrThrow: mocks.find, findFirstOrThrow: mocks.findFirst, update: mocks.update }, platformAudit: { create: mocks.audit } } }));
vi.mock("@/server/email/provider", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("@/server/whatsapp/provider", () => ({ getWhatsAppProvider: () => ({ send: mocks.sendWhatsApp }) }));

import { applyVerifiedProviderStatus, dispatchCommunicationMessage } from "@/server/communications/delivery";

const message = { id: "message-1", channel: "EMAIL", status: "QUEUED", recipientAddress: "person@example.com", body: "Hello", subject: "Subject", templateVersionId: null, provider: null, providerRef: null, sentAt: null, deliveredAt: null, readAt: null, failedAt: null } as const;

describe("communication provider boundary", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.find.mockResolvedValue(message); mocks.update.mockImplementation(async ({ data }) => ({ ...message, ...data })); });

  it("records provider submission without claiming delivery", async () => {
    mocks.sendEmail.mockResolvedValue({ status: "SUBMITTED", provider: "RESEND", providerRef: "email-1" });
    await dispatchCommunicationMessage(message.id);
    expect(mocks.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "SUBMITTED", providerRef: "email-1", submittedAt: expect.any(Date) }) }));
  });

  it("rejects unverified webhook updates before database mutation", async () => {
    await expect(applyVerifiedProviderStatus({ rawBody: "{}", signature: "bad", secret: "secret", provider: "RESEND", providerRef: "email-1", status: "DELIVERED" })).rejects.toThrow("Invalid provider webhook signature");
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("applies a verified monotonic delivery update", async () => {
    const rawBody = '{"status":"delivered"}';
    const secret = "secret";
    const signature = createHmac("sha256", secret).update(rawBody).digest("hex");
    mocks.findFirst.mockResolvedValue({ ...message, status: "SENT", provider: "RESEND", providerRef: "email-1" });
    await applyVerifiedProviderStatus({ rawBody, signature, secret, provider: "RESEND", providerRef: "email-1", status: "DELIVERED" });
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "DELIVERED", deliveredAt: expect.any(Date) }) }));
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "COMMUNICATION_PROVIDER_STATUS_UPDATED" }) }));
  });
});
