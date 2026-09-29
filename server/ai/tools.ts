import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS, type AuthorizationUser, type PermissionKey } from "@/lib/auth/permissions";
import { AuthorizationError } from "@/server/auth/authorization";
import { getOwnAcademicProgress, getOwnCareerProfile, getScopedLeadSummary } from "@/server/ai/tool-services";

type AssistantPolicy = { id: string; allowedTools: string[]; status: "ACTIVE" | "INACTIVE" };
type AIToolDefinition = { access: "READ" | "WRITE_PROPOSAL"; permission: PermissionKey | PermissionKey[]; schema: z.ZodType; execute?: (actor: AuthorizationUser, input: Record<string, unknown>) => Promise<unknown> };

export const AI_TOOL_REGISTRY = {
  "academic.get-own-progress": { access: "READ", permission: PERMISSIONS.AI_STUDENT, schema: z.object({}), execute: (actor) => getOwnAcademicProgress(actor.id) },
  "career.get-own-profile": { access: "READ", permission: PERMISSIONS.CAREER_PROFILE_MANAGE, schema: z.object({}), execute: (actor) => getOwnCareerProfile(actor.id) },
  "crm.get-lead-summary": { access: "READ", permission: [PERMISSIONS.AI_ADMISSION, PERMISSIONS.AI_BDM], schema: z.object({ leadId: z.string().uuid() }), execute: (actor, input) => getScopedLeadSummary(actor, String(input.leadId)) },
  "communications.propose-notification": { access: "WRITE_PROPOSAL", permission: PERMISSIONS.COMMUNICATIONS_SEND, schema: z.object({ recipientUserId: z.string().uuid(), message: z.string().trim().min(1).max(500) }) }
} satisfies Record<string, AIToolDefinition>;

export type AIToolCode = keyof typeof AI_TOOL_REGISTRY;

export function getAITool(code: string) {
  return AI_TOOL_REGISTRY[code as AIToolCode];
}

function hasAnyPermission(actor: AuthorizationUser, permission: PermissionKey | PermissionKey[]) {
  return (Array.isArray(permission) ? permission : [permission]).some((item) => hasPermission(actor, item));
}

export async function executeAIReadTool(input: { actor: AuthorizationUser; assistant: AssistantPolicy; code: AIToolCode; payload: unknown }) {
  const tool = getAITool(input.code);
  if (!tool || tool.access !== "READ" || !tool.execute) throw new AuthorizationError("AI tool is not available for direct execution");
  if (input.assistant.status !== "ACTIVE" || !input.assistant.allowedTools.includes(input.code)) throw new AuthorizationError("AI assistant is not allowed to use this tool");
  if (!hasAnyPermission(input.actor, tool.permission)) throw new AuthorizationError("AI tool permission denied");
  const payload = tool.schema.parse(input.payload) as Record<string, unknown>;
  const result = await tool.execute(input.actor, payload);
  await prisma.platformAudit.create({ data: { actorId: input.actor.id, action: "AI_READ_TOOL_EXECUTED", entity: "AIAssistant", entityId: input.assistant.id, metadata: { toolCode: input.code } } });
  return result;
}

export function validateAIWriteProposal(input: { actor: AuthorizationUser; assistant: AssistantPolicy; code: string; payload: unknown }) {
  const tool = getAITool(input.code);
  if (!tool || tool.access !== "WRITE_PROPOSAL") throw new AuthorizationError("AI write tool is not registered for proposals");
  if (input.assistant.status !== "ACTIVE" || !input.assistant.allowedTools.includes(input.code)) throw new AuthorizationError("AI assistant is not allowed to propose this tool");
  if (!hasAnyPermission(input.actor, tool.permission)) throw new AuthorizationError("AI tool permission denied");
  return tool.schema.parse(input.payload);
}

export function summarizeContextTools(context: { program?: string; currentDay?: string; pendingActivities: unknown[]; completedActivities: unknown[]; reflections: unknown[]; submissions: unknown[]; assessments: unknown[] }) {
  return { hasActiveProgram: Boolean(context.program), hasCurrentDay: Boolean(context.currentDay), pendingActivityCount: context.pendingActivities.length, completedActivityCount: context.completedActivities.length, reflectionCount: context.reflections.length, submissionCount: context.submissions.length, assessmentCount: context.assessments.length };
}
