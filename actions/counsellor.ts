"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ensureDefaultPipeline, requireCounsellorUser } from "@/server/admissions/queries";
import { counsellingDecisionSchema, counsellorOutcomeLabels, nextActionLabels, readinessLabels, type CounsellorOutcome } from "@/features/counsellor/schemas";

type ActionState = { ok: boolean; message: string };

const outcomeStage: Record<CounsellorOutcome, string> = {
  ADMISSION_RECOMMENDED: "application-started",
  APPLICATION_PENDING: "application-started",
  FOLLOW_UP_REQUIRED: "counselling-scheduled",
  NEEDS_MORE_INFORMATION: "counselling-scheduled",
  ON_HOLD: "on-hold",
  NOT_INTERESTED: "not-interested",
  NOT_ELIGIBLE: "not-qualified"
};

function parseDateTime(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isLimitedCounsellor(roles: string[]) {
  return roles.includes("Counsellor") && !roles.some((role) => role === "Admission" || role === "Director" || role === "Admin");
}

async function ensureCounsellorLeadAccess(leadId: string, actorId: string, limited: boolean) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      pipelineStage: true,
      activities: { where: { type: "TELECALLER_SENT_TO_COUNSELLOR" }, take: 1 },
      applications: { orderBy: { updatedAt: "desc" }, include: { program: true } }
    }
  });
  if (!lead) throw new Error("Lead not found.");
  const inCounsellingQueue = ["counselling-scheduled", "qualified"].includes(lead.pipelineStage.slug) || lead.activities.length > 0;
  if (limited && lead.assignedToId && lead.assignedToId !== actorId && !inCounsellingQueue) throw new Error("This candidate is assigned to another team member.");
  return lead;
}

function buildCounsellingNote(input: {
  candidateObjective?: string;
  currentSituation?: string;
  questions?: string;
  notes: string;
  recommendedProgram?: string;
  readiness: string;
  outcome: string;
  nextAction: string;
  followUpAt?: Date | null;
}) {
  return [
    input.candidateObjective ? `Objective: ${input.candidateObjective}` : null,
    input.currentSituation ? `Situation: ${input.currentSituation}` : null,
    input.questions ? `Questions/concerns: ${input.questions}` : null,
    `Counsellor notes: ${input.notes}`,
    input.recommendedProgram ? `Recommended program: ${input.recommendedProgram}` : null,
    `Readiness: ${input.readiness}`,
    `Outcome: ${input.outcome}`,
    `Next action: ${input.nextAction}`,
    input.followUpAt ? `Follow-up: ${input.followUpAt.toLocaleString("en-IN")}` : null
  ].filter(Boolean).join("\n");
}

export async function saveCounsellingDecisionAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireCounsellorUser();
  const roles = actor.roles.map((item) => item.role.name);
  const limited = isLimitedCounsellor(roles);
  const parsed = counsellingDecisionSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check counselling details." };
  }

  try {
    const stages = await ensureDefaultPipeline();
    const lead = await ensureCounsellorLeadAccess(parsed.data.leadId, actor.id, limited);
    const targetStage = stages.find((stage) => stage.slug === outcomeStage[parsed.data.outcome]);
    const recommendedProgram = parsed.data.recommendedProgramId
      ? await prisma.program.findUnique({ where: { id: parsed.data.recommendedProgramId } })
      : null;
    const programId = parsed.data.recommendedProgramId || lead.programInterestedId || lead.applications[0]?.programId;
    const followUpAt = parseDateTime(parsed.data.followUpAt);
    const outcomeLabel = counsellorOutcomeLabels[parsed.data.outcome];
    const readinessLabel = readinessLabels[parsed.data.readiness];
    const nextActionLabel = nextActionLabels[parsed.data.nextAction];
    const counsellingNote = buildCounsellingNote({
      candidateObjective: parsed.data.candidateObjective,
      currentSituation: parsed.data.currentSituation,
      questions: parsed.data.questions,
      notes: parsed.data.notes,
      recommendedProgram: recommendedProgram?.name,
      readiness: readinessLabel,
      outcome: outcomeLabel,
      nextAction: nextActionLabel,
      followUpAt
    });

    await prisma.$transaction(async (tx) => {
      const existingSession = await tx.counsellingSession.findFirst({
        where: {
          leadId: lead.id,
          counsellorId: actor.id,
          outcome: { in: ["SCHEDULED", "RESCHEDULED"] }
        },
        orderBy: { scheduledAt: "desc" }
      });

      if (existingSession) {
        await tx.counsellingSession.update({
          where: { id: existingSession.id },
          data: {
            outcome: parsed.data.outcome === "ADMISSION_RECOMMENDED" || parsed.data.outcome === "APPLICATION_PENDING" ? "CONVERTED" : parsed.data.outcome === "NOT_INTERESTED" ? "NOT_INTERESTED" : "ATTENDED",
            notes: counsellingNote,
            nextFollowUpAt: followUpAt
          }
        });
      } else {
        await tx.counsellingSession.create({
          data: {
            leadId: lead.id,
            counsellorId: actor.id,
            scheduledAt: new Date(),
            outcome: parsed.data.outcome === "ADMISSION_RECOMMENDED" || parsed.data.outcome === "APPLICATION_PENDING" ? "CONVERTED" : parsed.data.outcome === "NOT_INTERESTED" ? "NOT_INTERESTED" : "ATTENDED",
            notes: counsellingNote,
            nextFollowUpAt: followUpAt
          }
        });
      }

      await tx.lead.update({
        where: { id: lead.id },
        data: {
          assignedToId: actor.id,
          pipelineStageId: targetStage?.id ?? lead.pipelineStageId,
          status: parsed.data.outcome === "NOT_INTERESTED" || parsed.data.outcome === "NOT_ELIGIBLE" ? "LOST" : "OPEN"
        }
      });

      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          actorId: actor.id,
          type: `COUNSELLOR_${parsed.data.outcome}`,
          summary: `Counselling decision: ${outcomeLabel}. Next action: ${nextActionLabel}.${recommendedProgram ? ` Recommended: ${recommendedProgram.name}.` : ""}`
        }
      });

      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          actorId: actor.id,
          type: "COUNSELLOR_COUNSELLING_COMPLETED",
          summary: counsellingNote
        }
      });

      await tx.leadNote.create({
        data: {
          leadId: lead.id,
          authorId: actor.id,
          note: counsellingNote
        }
      });

      if (followUpAt) {
        await tx.communicationLog.create({
          data: {
            leadId: lead.id,
            userId: actor.id,
            channel: "INTERNAL_NOTIFICATION",
            status: "SCHEDULED",
            subject: "Counsellor follow-up",
            message: `${nextActionLabel}: ${parsed.data.notes}`,
            scheduledAt: followUpAt
          }
        });
      }

      if ((parsed.data.nextAction === "MOVE_TO_ADMISSION" || parsed.data.outcome === "ADMISSION_RECOMMENDED") && programId) {
        const existingApplication = await tx.admissionApplication.findFirst({
          where: {
            leadId: lead.id,
            programId,
            status: { in: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED"] }
          },
          orderBy: { updatedAt: "desc" }
        });

        if (existingApplication) {
          await tx.admissionApplication.update({
            where: { id: existingApplication.id },
            data: {
              status: existingApplication.status === "APPROVED" ? "APPROVED" : "UNDER_REVIEW",
              submittedAt: existingApplication.submittedAt ?? new Date()
            }
          });
        } else {
          await tx.admissionApplication.create({
            data: {
            leadId: lead.id,
            programId,
            status: "UNDER_REVIEW",
            submittedAt: new Date(),
            data: {
              source: "counsellor_handoff",
              recommendedProgramId: recommendedProgram?.id,
              originalProgramInterestedId: lead.programInterestedId,
              readiness: parsed.data.readiness
            }
          }
          });
        }

        await tx.leadActivity.create({
          data: {
            leadId: lead.id,
            actorId: actor.id,
            type: "COUNSELLOR_MOVED_TO_ADMISSION",
            summary: `Candidate moved to Admission for ${recommendedProgram?.name ?? lead.applications[0]?.program.name ?? "selected program"}.`
          }
        });
      }
    });

    revalidatePath("/counsellor");
    revalidatePath(`/counsellor/leads/${lead.id}`);
    revalidatePath("/telecaller");
    revalidatePath("/admissions/leads");
    revalidatePath("/admissions/applications");
    revalidatePath("/admissions/review");

    return { ok: true, message: parsed.data.nextAction === "MOVE_TO_ADMISSION" ? "Counselling saved and moved to Admission." : "Counselling saved." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not save counselling." };
  }
}

export async function assignCounsellingToMeAction(formData: FormData) {
  const actor = await requireCounsellorUser();
  const roles = actor.roles.map((item) => item.role.name);
  const leadId = String(formData.get("leadId") ?? "");

  try {
    await ensureDefaultPipeline();
    await ensureCounsellorLeadAccess(leadId, actor.id, isLimitedCounsellor(roles));
    await prisma.$transaction([
      prisma.lead.update({ where: { id: leadId }, data: { assignedToId: actor.id } }),
      prisma.leadActivity.create({
        data: {
          leadId,
          actorId: actor.id,
          type: "COUNSELLOR_ASSIGNED",
          summary: `Counselling assigned to ${actor.name}.`
        }
      })
    ]);
  } catch {
    return;
  }

  revalidatePath("/counsellor");
  revalidatePath(`/counsellor/leads/${leadId}`);
}
