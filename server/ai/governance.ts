import { prisma } from "@/lib/prisma";
import { canAccessResource, PERMISSIONS, type AuthorizationUser, type ResourceScope } from "@/lib/auth/permissions";
import { requirePermission } from "@/server/auth/authorization";
import { ensureTaraAssistant } from "@/server/ai/assistants";
import { publicAIProviderConfig } from "@/server/ai/config";

export async function getAIGovernanceOverview() {
  const actor = await requirePermission(PERMISSIONS.AI_AUDIT, "/admin-login");
  await ensureTaraAssistant();
  const [assistants, proposals, usage] = await Promise.all([
    prisma.aIAssistant.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { conversations: true, usageLogs: true } } } }),
    prisma.aIActionProposal.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { assistant: { select: { name: true } }, actor: { select: { name: true } }, reviewedBy: { select: { name: true } } } }),
    prisma.aIUsageLog.groupBy({ by: ["provider", "model", "success"], _count: true, _sum: { inputTokens: true, outputTokens: true }, orderBy: { provider: "asc" } })
  ]);
  return { assistants, proposals: filterAuthorizedAIProposals(actor, proposals, PERMISSIONS.AI_AUDIT).slice(0, 30), usage, provider: publicAIProviderConfig() };
}

export function proposalResourceScope(value: unknown): ResourceScope {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const resource: ResourceScope = {};
  for (const key of ["ownerId", "institutionId", "divisionId", "districtId", "campusId", "departmentId"] as const) {
    if (typeof source[key] === "string") resource[key] = source[key];
  }
  return resource;
}

export function filterAuthorizedAIProposals<T extends { organizationContext: unknown }>(actor: AuthorizationUser, proposals: T[], permission: typeof PERMISSIONS.AI_APPROVE | typeof PERMISSIONS.AI_AUDIT = PERMISSIONS.AI_APPROVE) {
  return proposals.filter((proposal) => canAccessResource(actor, permission, proposalResourceScope(proposal.organizationContext)));
}
