import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getWhatsAppProvider } from "./provider";

type SendWhatsAppMessageInput = {
  to: string;
  template: string;
  message: string;
  applicationId?: string | null;
  userId?: string | null;
  metadata?: Prisma.InputJsonObject;
};

export async function sendWhatsAppMessage(input: SendWhatsAppMessageInput) {
  const storedMessage = input.template === "approved_admission_pin"
    ? "[REDACTED: admission credential]"
    : input.template.includes("otp") ? "[REDACTED: authentication credential]" : input.message;
  const queued = await prisma.whatsAppMessageLog.create({
    data: {
      to: input.to,
      template: input.template,
      message: storedMessage,
      status: "QUEUED",
      provider: "PENDING",
      applicationId: input.applicationId ?? null,
      userId: input.userId ?? null,
      metadata: input.metadata
    }
  });
  const provider = getWhatsAppProvider();
  const result = await provider.send({
    to: input.to,
    template: input.template,
    message: input.message
  });

  return prisma.whatsAppMessageLog.update({
    where: { id: queued.id },
    data: {
      status: result.status,
      provider: result.provider,
      providerRef: result.providerRef,
      metadata: result.error ? { ...input.metadata, error: result.error } : input.metadata,
      sentAt: result.status === "SENT" ? new Date() : null
    }
  });
}
