"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { leadAssignmentSchema, leadFollowUpSchema } from "@/features/crm/schemas";
import { requireAdmissionUser } from "@/server/admissions/queries";
import { assertLeadAccess } from "@/server/auth/resource-access";
import { assertAssignableEmployee } from "@/server/crm/service";

type State = { ok: boolean; message: string };

export async function assignLeadAction(_: State, formData: FormData): Promise<State> {
  const actor = await requireAdmissionUser();
  const parsed = leadAssignmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check the lead assignment." };
  await assertLeadAccess(actor, PERMISSIONS.ADMISSIONS_MANAGE, parsed.data.leadId);
  const assigneeId = parsed.data.assignedToId || null;
  if (assigneeId) await assertAssignableEmployee(actor, assigneeId);

  await prisma.$transaction(async (tx) => {
    await tx.lead.update({ where: { id: parsed.data.leadId }, data: { assignedToId: assigneeId } });
    await tx.leadActivity.create({
      data: { leadId: parsed.data.leadId, actorId: actor.id, type: "LEAD_ASSIGNED", summary: assigneeId ? "Lead assignment updated." : "Lead returned to the unassigned queue." }
    });
    await tx.auditLog.create({ data: { userId: actor.id, action: "LEAD_ASSIGNMENT_UPDATED", entity: "Lead", entityId: parsed.data.leadId, metadata: { assignedToId: assigneeId } } });
  });
  revalidatePath("/admissions/leads");
  revalidatePath(`/admissions/leads/${parsed.data.leadId}`);
  return { ok: true, message: "Lead assignment saved." };
}

export async function scheduleLeadFollowUpAction(_: State, formData: FormData): Promise<State> {
  const actor = await requireAdmissionUser();
  const parsed = leadFollowUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check follow-up details." };
  await assertLeadAccess(actor, PERMISSIONS.ADMISSIONS_MANAGE, parsed.data.leadId);
  const scheduledAt = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) return { ok: false, message: "Enter a valid follow-up time." };

  await prisma.$transaction(async (tx) => {
    await tx.communicationLog.create({
      data: { leadId: parsed.data.leadId, userId: actor.id, channel: "INTERNAL_NOTIFICATION", status: "SCHEDULED", subject: parsed.data.subject, message: parsed.data.note, scheduledAt }
    });
    await tx.leadActivity.create({ data: { leadId: parsed.data.leadId, actorId: actor.id, type: "FOLLOW_UP_SCHEDULED", summary: `${parsed.data.subject} scheduled.` } });
    await tx.auditLog.create({ data: { userId: actor.id, action: "LEAD_FOLLOW_UP_SCHEDULED", entity: "Lead", entityId: parsed.data.leadId, metadata: { scheduledAt: scheduledAt.toISOString() } } });
  });
  revalidatePath(`/admissions/leads/${parsed.data.leadId}`);
  return { ok: true, message: "Follow-up scheduled." };
}
