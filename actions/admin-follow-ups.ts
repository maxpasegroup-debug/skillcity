"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { adminFollowUpSchema, adminFollowUpStatusSchema } from "@/features/admin/schemas";
import { requireAdminUser } from "@/server/admin/queries";
import { writeAuditLog } from "@/server/audit/log";

type State = { ok: boolean; message: string };
const state: State = { ok: false, message: "" };

function emptyToNull(value: string | undefined) {
  return value && value.trim() ? value : null;
}

function metadataObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export async function createAdminFollowUpAction(previousState: State = state, formData: FormData): Promise<State> {
  void previousState;
  const actor = await requireAdminUser();
  const parsed = adminFollowUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check follow-up details." };

  const student = await prisma.user.findUnique({ where: { id: parsed.data.studentId }, select: { id: true, name: true } });
  if (!student) return { ok: false, message: "Student not found." };

  const ownerId = emptyToNull(parsed.data.ownerId) ?? actor.id;
  const owner = await prisma.user.findUnique({ where: { id: ownerId }, include: { roles: { include: { role: true } } } });
  if (!owner) return { ok: false, message: "Owner not found." };

  const batchId = emptyToNull(parsed.data.batchId);
  if (batchId) {
    const enrollment = await prisma.studentEnrollment.findFirst({ where: { studentId: student.id, batchId, status: "ACTIVE" }, select: { id: true } });
    if (!enrollment) return { ok: false, message: "Student is not active in this batch." };
  }

  const followUpAt = parsed.data.followUpAt ? new Date(parsed.data.followUpAt) : null;
  if (parsed.data.followUpAt && (!followUpAt || Number.isNaN(followUpAt.getTime()))) return { ok: false, message: "Enter a valid follow-up date." };

  const log = await prisma.communicationLog.create({
    data: {
      userId: ownerId,
      channel: "INTERNAL_NOTIFICATION",
      status: parsed.data.status === "RESOLVED" ? "SENT" : followUpAt ? "SCHEDULED" : "DRAFT",
      subject: "Academic follow-up",
      message: parsed.data.note,
      scheduledAt: followUpAt,
      sentAt: parsed.data.status === "RESOLVED" ? new Date() : null,
      metadata: {
        kind: "ADMIN_ACADEMIC_FOLLOW_UP",
        studentId: student.id,
        batchId,
        ownerId,
        createdById: actor.id,
        priority: parsed.data.priority,
        status: parsed.data.status,
        nextAction: parsed.data.nextAction
      }
    }
  });

  if (ownerId !== actor.id) {
    const ownerRoles = owner.roles.map((item) => item.role.name);
    const actionUrl = ownerRoles.includes("Trainer") ? "/trainer/students" : ownerRoles.includes("Counsellor") ? "/counsellor" : ownerRoles.includes("Admission") ? "/admissions/action-queue" : "/admin/follow-ups";
    await prisma.notification.create({
      data: {
        userId: ownerId,
        type: "SYSTEM",
        title: "Follow-up assigned",
        message: `${student.name} needs follow-up: ${parsed.data.nextAction}`,
        actionUrl
      }
    });
  }

  await writeAuditLog({
    userId: actor.id,
    action: "ADMIN_FOLLOW_UP_CREATED",
    entity: "CommunicationLog",
    entityId: log.id,
    metadata: { studentId: student.id, ownerId, batchId, priority: parsed.data.priority, status: parsed.data.status }
  });

  revalidatePath("/admin/follow-ups");
  revalidatePath("/admin/academic-health");
  revalidatePath("/admin/dashboard");
  return { ok: true, message: "Follow-up saved." };
}

export async function updateAdminFollowUpStatusAction(previousState: State = state, formData: FormData): Promise<State> {
  void previousState;
  const actor = await requireAdminUser();
  const parsed = adminFollowUpStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Check follow-up status." };

  const existing = await prisma.communicationLog.findUnique({ where: { id: parsed.data.followUpId } });
  if (!existing || existing.subject !== "Academic follow-up") return { ok: false, message: "Follow-up not found." };
  const metadata = metadataObject(existing.metadata);

  await prisma.communicationLog.update({
    where: { id: existing.id },
    data: {
      status: parsed.data.status === "RESOLVED" ? "SENT" : existing.scheduledAt ? "SCHEDULED" : "DRAFT",
      sentAt: parsed.data.status === "RESOLVED" ? new Date() : existing.sentAt,
      metadata: {
        ...metadata,
        status: parsed.data.status,
        updatedById: actor.id,
        resolvedAt: parsed.data.status === "RESOLVED" ? new Date().toISOString() : metadata.resolvedAt ?? null
      }
    }
  });

  await writeAuditLog({
    userId: actor.id,
    action: "ADMIN_FOLLOW_UP_STATUS_UPDATED",
    entity: "CommunicationLog",
    entityId: existing.id,
    metadata: { status: parsed.data.status }
  });

  revalidatePath("/admin/follow-ups");
  revalidatePath("/admin/dashboard");
  return { ok: true, message: "Follow-up updated." };
}
