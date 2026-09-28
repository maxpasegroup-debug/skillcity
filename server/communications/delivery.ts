import type { CommunicationDeliveryStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canApplyDeliveryStatus, verifyWebhookSignature } from "@/lib/communications/policies";
import { sendEmail } from "@/server/email/provider";
import { getWhatsAppProvider } from "@/server/whatsapp/provider";

export async function dispatchCommunicationMessage(messageId: string) {
  const message = await prisma.communicationMessage.findUniqueOrThrow({ where: { id: messageId } });
  if (message.status !== "QUEUED" && message.status !== "FAILED") return message;
  if (!message.recipientAddress || !message.body) throw new Error("External communication is missing its recipient or body");
  await prisma.communicationMessage.update({ where: { id: message.id }, data: { status: "PROCESSING", attempts: { increment: 1 }, errorCode: null, errorMessage: null } });
  try {
    if (message.channel === "EMAIL") {
      const result = await sendEmail({ to: message.recipientAddress, subject: message.subject ?? "AIRA Skill City", html: message.body });
      return prisma.communicationMessage.update({ where: { id: message.id }, data: { status: result.status, provider: result.provider, providerRef: result.providerRef, submittedAt: result.status === "SUBMITTED" ? new Date() : null } });
    }
    if (message.channel === "WHATSAPP") {
      const result = await getWhatsAppProvider().send({ to: message.recipientAddress, template: message.templateVersionId ?? "unversioned", message: message.body });
      return prisma.communicationMessage.update({ where: { id: message.id }, data: { status: result.status, provider: result.provider, providerRef: result.providerRef, sentAt: result.status === "SENT" ? new Date() : null, errorMessage: result.error } });
    }
    throw new Error(`Unsupported external communication channel: ${message.channel}`);
  } catch (error) {
    await prisma.communicationMessage.update({ where: { id: message.id }, data: { status: "FAILED", failedAt: new Date(), errorCode: "PROVIDER_ERROR", errorMessage: error instanceof Error ? error.message.slice(0, 2_000) : "Provider submission failed" } });
    throw error;
  }
}

type ProviderStatusInput = {
  rawBody: string;
  signature: string | null;
  secret: string;
  provider: string;
  providerRef: string;
  status: CommunicationDeliveryStatus;
};

export async function applyVerifiedProviderStatus(input: ProviderStatusInput) {
  if (!verifyWebhookSignature(input.rawBody, input.signature, input.secret)) throw new Error("Invalid provider webhook signature");
  const message = await prisma.communicationMessage.findFirstOrThrow({ where: { provider: input.provider, providerRef: input.providerRef } });
  if (!canApplyDeliveryStatus(message.status, input.status)) return message;
  const now = new Date();
  const updated = await prisma.communicationMessage.update({
    where: { id: message.id },
    data: {
      status: input.status,
      sentAt: input.status === "SENT" ? message.sentAt ?? now : message.sentAt,
      deliveredAt: input.status === "DELIVERED" ? message.deliveredAt ?? now : message.deliveredAt,
      readAt: input.status === "READ" ? message.readAt ?? now : message.readAt,
      failedAt: input.status === "FAILED" ? message.failedAt ?? now : message.failedAt
    }
  });
  await prisma.platformAudit.create({ data: { action: "COMMUNICATION_PROVIDER_STATUS_UPDATED", entity: "CommunicationMessage", entityId: message.id, metadata: { provider: input.provider, from: message.status, to: input.status } } });
  return updated;
}
