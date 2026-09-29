"use server";

import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { canAccessResource, hasPermission, PERMISSIONS, type ResourceScope } from "@/lib/auth/permissions";
import { AuthorizationError } from "@/server/auth/authorization";
import { getCurrentUser } from "@/server/auth/session";
import { validateAIWriteProposal } from "@/server/ai/tools";

type ActionState = { ok: boolean; message: string };

function actorOrganizationContext(actor: Awaited<ReturnType<typeof getCurrentUser>>) {
  const profile = actor?.employeeProfile;
  if (!profile) return { ownerId: actor?.id };
  return { ownerId: actor.id, institutionId: profile.institutionId, divisionId: profile.divisionId, districtId: profile.districtId, campusId: profile.campusId, departmentId: profile.departmentId };
}

export async function createAIActionProposalAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await getCurrentUser();
  if (!actor) throw new AuthorizationError();
  const assistantCode = String(formData.get("assistantCode") ?? "tara");
  const toolCode = String(formData.get("toolCode") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const clientKey = String(formData.get("idempotencyKey") ?? "").trim();
  if (!reason || reason.length > 500 || !clientKey) return { ok: false, message: "A reason and idempotency key are required." };
  let payload: unknown;
  try { payload = JSON.parse(String(formData.get("input") ?? "{}")); } catch { return { ok: false, message: "Proposal input must be valid JSON." }; }
  const assistant = await prisma.aIAssistant.findUnique({ where: { code: assistantCode } });
  if (!assistant) throw new AuthorizationError("AI assistant was not found");
  const validated = validateAIWriteProposal({ actor, assistant, code: toolCode, payload });
  const idempotencyKey = createHash("sha256").update(`${actor.id}:${clientKey}`).digest("hex");
  const organizationContext = actorOrganizationContext(actor);
  let proposal;
  try {
    proposal = await prisma.$transaction(async (tx) => {
      const existing = await tx.aIActionProposal.findUnique({ where: { idempotencyKey } });
      if (existing) return existing;
      const created = await tx.aIActionProposal.create({ data: { idempotencyKey, assistantId: assistant.id, actorId: actor.id, toolCode, input: validated as Prisma.InputJsonValue, reason, organizationContext } });
      await tx.platformAudit.create({ data: { actorId: actor.id, action: "AI_ACTION_PROPOSED", entity: "AIActionProposal", entityId: created.id, metadata: { assistantCode, toolCode } } });
      return created;
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    proposal = await prisma.aIActionProposal.findUniqueOrThrow({ where: { idempotencyKey } });
  }
  revalidatePath("/ai");
  return { ok: true, message: `Proposal ${proposal.status.toLowerCase().replaceAll("_", " ")}.` };
}

async function reviewProposal(formData: FormData, decision: "APPROVED" | "REJECTED"): Promise<ActionState> {
  const actor = await getCurrentUser();
  if (!actor || !hasPermission(actor, PERMISSIONS.AI_APPROVE)) throw new AuthorizationError("AI approval permission required");
  const id = String(formData.get("proposalId") ?? "");
  const note = String(formData.get("reviewNote") ?? "").trim();
  const proposal = await prisma.aIActionProposal.findUnique({ where: { id } });
  if (!proposal || proposal.status !== "PENDING_APPROVAL") return { ok: false, message: "Pending proposal was not found." };
  const resource = (proposal.organizationContext ?? {}) as ResourceScope;
  if (!canAccessResource(actor, PERMISSIONS.AI_APPROVE, resource)) throw new AuthorizationError("Proposal is outside the authorized organization scope");
  await prisma.$transaction(async (tx) => {
    const updated = await tx.aIActionProposal.updateMany({ where: { id, status: "PENDING_APPROVAL" }, data: { status: decision, reviewedById: actor.id, reviewedAt: new Date(), reviewNote: note || null } });
    if (updated.count !== 1) throw new AuthorizationError("Proposal has already been reviewed");
    await tx.platformAudit.create({ data: { actorId: actor.id, action: `AI_ACTION_${decision}`, entity: "AIActionProposal", entityId: id, metadata: { toolCode: proposal.toolCode } } });
  });
  revalidatePath("/ai");
  return { ok: true, message: `Proposal ${decision.toLowerCase()}. No business mutation was executed.` };
}

export async function approveAIActionProposalAction(_: ActionState, formData: FormData) { return reviewProposal(formData, "APPROVED"); }
export async function rejectAIActionProposalAction(_: ActionState, formData: FormData) { return reviewProposal(formData, "REJECTED"); }
