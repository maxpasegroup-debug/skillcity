import { prisma } from "@/lib/prisma";

export const TARA_ASSISTANT = {
  code: "tara",
  name: "Tara",
  description: "AIRA's governed learning, admissions and operational assistant.",
  allowedTools: ["academic.get-own-progress", "career.get-own-profile", "crm.get-lead-summary", "communications.propose-notification"],
  allowedDomains: ["academic", "career", "crm", "communications"]
} as const;

export async function ensureTaraAssistant() {
  return prisma.aIAssistant.upsert({
    where: { code: TARA_ASSISTANT.code },
    update: { name: TARA_ASSISTANT.name, description: TARA_ASSISTANT.description, status: "ACTIVE", allowedTools: [...TARA_ASSISTANT.allowedTools], allowedDomains: [...TARA_ASSISTANT.allowedDomains] },
    create: { ...TARA_ASSISTANT, allowedTools: [...TARA_ASSISTANT.allowedTools], allowedDomains: [...TARA_ASSISTANT.allowedDomains] }
  });
}
