import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { requirePermission } from "@/server/auth/authorization";
import { ensureTaraAssistant } from "@/server/ai/assistants";
import { publicAIProviderConfig } from "@/server/ai/config";

export async function getAIGovernanceOverview() {
  await requirePermission(PERMISSIONS.AI_AUDIT, "/admin-login");
  await ensureTaraAssistant();
  const [assistants, proposals, usage] = await Promise.all([
    prisma.aIAssistant.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { conversations: true, usageLogs: true } } } }),
    prisma.aIActionProposal.findMany({ orderBy: { createdAt: "desc" }, take: 30, include: { assistant: { select: { name: true } }, actor: { select: { name: true } }, reviewedBy: { select: { name: true } } } }),
    prisma.aIUsageLog.groupBy({ by: ["provider", "model", "success"], _count: true, _sum: { inputTokens: true, outputTokens: true }, orderBy: { provider: "asc" } })
  ]);
  return { assistants, proposals, usage, provider: publicAIProviderConfig() };
}
