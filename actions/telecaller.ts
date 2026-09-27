"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS, type AuthorizationUser } from "@/lib/auth/permissions";
import { ensureDefaultPipeline, requireTelecallerUser } from "@/server/admissions/queries";
import { assertLeadAccess } from "@/server/auth/resource-access";
import { telecallerOutcomeLabels, telecallerOutcomeSchema, type TelecallerOutcome } from "@/features/telecaller/schemas";

type ActionState = { ok: boolean; message: string };

const outcomeStage: Partial<Record<TelecallerOutcome, string>> = {
  INTERESTED: "interested",
  NEEDS_MORE_INFORMATION: "contacted",
  CALLBACK_REQUESTED: "contacted",
  NOT_INTERESTED: "not-interested",
  WRONG_NUMBER: "not-interested",
  NO_ANSWER: "contacted",
  QUALIFIED: "qualified",
  SENT_TO_COUNSELLOR: "counselling-scheduled"
};

function parseDateTime(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isLimitedTelecaller(user: AuthorizationUser) {
  return hasPermission(user, PERMISSIONS.TELECALLER_ACCESS) && !hasPermission(user, PERMISSIONS.ADMISSIONS_ACCESS);
}

async function ensureLeadAccess(leadId: string, actor: AuthorizationUser, limited: boolean) {
  await assertLeadAccess(actor, PERMISSIONS.TELECALLER_ACCESS, leadId);
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, assignedToId: true, ownerId: true, institutionId: true, divisionId: true, districtId: true, campusId: true, name: true }
  });
  if (!lead) throw new Error("Lead not found.");
  if (limited && lead.assignedToId && lead.assignedToId !== actor.id) throw new Error("This lead is assigned to another team member.");
  return lead;
}

export async function recordTelecallerOutcomeAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireTelecallerUser();
  const limited = isLimitedTelecaller(actor);
  const parsed = telecallerOutcomeSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the call outcome." };
  }

  try {
    await ensureDefaultPipeline();
    await ensureLeadAccess(parsed.data.leadId, actor, limited);
    const stageSlug = outcomeStage[parsed.data.outcome];
    const stage = stageSlug ? await prisma.pipelineStage.findUnique({ where: { slug: stageSlug } }) : null;
    const nextFollowUpAt = parseDateTime(parsed.data.nextFollowUpAt);
    const label = telecallerOutcomeLabels[parsed.data.outcome];
    const note = parsed.data.note?.trim();
    const summaryParts = [`Telecaller outcome: ${label}.`];

    if (note) summaryParts.push(note);
    if (nextFollowUpAt) summaryParts.push(`Next follow-up: ${nextFollowUpAt.toLocaleString("en-IN")}.`);

    await prisma.$transaction(async (tx) => {
      await tx.lead.update({
        where: { id: parsed.data.leadId },
        data: {
          assignedToId: limited ? actor.id : undefined,
          pipelineStageId: stage?.id,
          status: parsed.data.outcome === "NOT_INTERESTED" || parsed.data.outcome === "WRONG_NUMBER" ? "LOST" : "OPEN"
        }
      });

      await tx.leadActivity.create({
        data: {
          leadId: parsed.data.leadId,
          actorId: actor.id,
          type: `TELECALLER_${parsed.data.outcome}`,
          summary: summaryParts.join(" ")
        }
      });

      if (note) {
        await tx.leadNote.create({
          data: {
            leadId: parsed.data.leadId,
            authorId: actor.id,
            note
          }
        });
      }

      if (nextFollowUpAt) {
        await tx.communicationLog.create({
          data: {
            leadId: parsed.data.leadId,
            userId: actor.id,
            channel: "INTERNAL_NOTIFICATION",
            status: "SCHEDULED",
            subject: "Telecaller follow-up",
            message: note || `Follow up after telecaller outcome: ${label}.`,
            scheduledAt: nextFollowUpAt
          }
        });
      }

      if (parsed.data.outcome === "SENT_TO_COUNSELLOR") {
        await tx.leadActivity.create({
          data: {
            leadId: parsed.data.leadId,
            actorId: actor.id,
            type: "TELECALLER_HANDOFF_TO_COUNSELLOR",
            summary: `Lead sent to counsellor by ${actor.name} on ${new Date().toLocaleString("en-IN")}.`
          }
        });
      }
    });

    revalidatePath("/telecaller");
    revalidatePath(`/telecaller/leads/${parsed.data.leadId}`);
    revalidatePath("/admissions/leads");
    revalidatePath("/admissions/dashboard");

    return {
      ok: true,
      message: parsed.data.outcome === "SENT_TO_COUNSELLOR" ? "Lead sent to counsellor." : "Outcome saved."
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not save the outcome." };
  }
}

export async function assignLeadToMeAction(formData: FormData) {
  const actor = await requireTelecallerUser();
  const limited = isLimitedTelecaller(actor);
  const leadId = String(formData.get("leadId") ?? "");

  try {
    await ensureLeadAccess(leadId, actor, limited);
    await prisma.$transaction([
      prisma.lead.update({ where: { id: leadId }, data: { assignedToId: actor.id } }),
      prisma.leadActivity.create({
        data: {
          leadId,
          actorId: actor.id,
          type: "TELECALLER_ASSIGNED",
          summary: `Lead assigned to ${actor.name}.`
        }
      })
    ]);
  } catch {
    return;
  }

  revalidatePath("/telecaller");
  revalidatePath(`/telecaller/leads/${leadId}`);
}
