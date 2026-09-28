"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { normalizeCommunicationCode, templateVariables } from "@/lib/communications/policies";
import { communicationTemplateSchema, eventAutomationSchema, processEventsSchema } from "@/features/communications/schemas";
import { assertPermission, AuthorizationError } from "@/server/auth/authorization";
import { getCurrentUser } from "@/server/auth/session";
import { domainEventScopeWhere } from "@/server/auth/scoping";
import { validateOrganizationPathForActor } from "@/server/organization/service";
import { processDomainEvent } from "@/server/communications/automation";

export type CommunicationActionState = { ok: boolean; message: string };
const failure = (message: string): CommunicationActionState => ({ ok: false, message });
const optional = (value?: string) => value?.trim() || null;

export async function createCommunicationTemplateAction(_: CommunicationActionState, formData: FormData): Promise<CommunicationActionState> {
  const actor = await assertPermission(PERMISSIONS.COMMUNICATION_TEMPLATES_MANAGE);
  const parsed = communicationTemplateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Check template details.");
  const data = parsed.data;
  const path = { institutionId: data.institutionId, divisionId: optional(data.divisionId), districtId: optional(data.districtId), campusId: optional(data.campusId), departmentId: optional(data.departmentId) };
  await validateOrganizationPathForActor(actor, PERMISSIONS.COMMUNICATION_TEMPLATES_MANAGE, path);
  const code = normalizeCommunicationCode(data.code);
  try {
    await prisma.$transaction(async (tx) => {
      const template = await tx.communicationTemplate.create({ data: { ...path, code, name: data.name, channel: data.channel, purpose: data.purpose, status: "ACTIVE", createdById: actor.id } });
      await tx.communicationTemplateVersion.create({ data: { templateId: template.id, version: 1, subject: optional(data.subject), body: data.body, requiredVariables: templateVariables(`${data.subject ?? ""}\n${data.body}`), providerTemplateId: optional(data.providerTemplateId), locale: data.locale } });
      await tx.platformAudit.create({ data: { actorId: actor.id, action: "COMMUNICATION_TEMPLATE_CREATED", entity: "CommunicationTemplate", entityId: template.id, metadata: { code, channel: data.channel } } });
    });
    revalidatePath("/communications/templates");
    return { ok: true, message: "Communication template created with version 1." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return failure("Template code is already in use for this organization.");
    throw error;
  }
}

export async function createEventAutomationAction(_: CommunicationActionState, formData: FormData): Promise<CommunicationActionState> {
  const actor = await assertPermission(PERMISSIONS.AUTOMATIONS_MANAGE);
  const parsed = eventAutomationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Check automation details.");
  const data = parsed.data;
  const path = { institutionId: data.institutionId, divisionId: optional(data.divisionId), districtId: optional(data.districtId), campusId: optional(data.campusId), departmentId: optional(data.departmentId) };
  await validateOrganizationPathForActor(actor, PERMISSIONS.AUTOMATIONS_MANAGE, path);
  const code = normalizeCommunicationCode(data.code);
  try {
    await prisma.$transaction(async (tx) => {
      const rule = await tx.automationRule.create({ data: { ...path, code, name: data.name, description: optional(data.description), triggerType: "EVENT", eventType: data.eventType, actionType: "SEND_NOTIFICATION", conditions: {}, actionConfig: { recipientPayloadKey: data.recipientPayloadKey, title: data.title, message: data.message, actionUrl: optional(data.actionUrl) }, active: true, maxAttempts: data.maxAttempts, createdById: actor.id } });
      await tx.platformAudit.create({ data: { actorId: actor.id, action: "EVENT_AUTOMATION_CREATED", entity: "AutomationRule", entityId: rule.id, metadata: { code, eventType: data.eventType, actionType: "SEND_NOTIFICATION" } } });
    });
    revalidatePath("/communications/automations");
    return { ok: true, message: "Controlled event automation created." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return failure("Automation code is already in use.");
    throw error;
  }
}

export async function processPendingEventsAction(_: CommunicationActionState, formData: FormData): Promise<CommunicationActionState> {
  const actor = await assertPermission(PERMISSIONS.AUTOMATIONS_MANAGE);
  const parsed = processEventsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Invalid processing limit.");
  const events = await prisma.domainEvent.findMany({ where: { AND: [domainEventScopeWhere(actor, PERMISSIONS.AUTOMATIONS_MANAGE), { status: { in: ["PENDING", "FAILED"] }, availableAt: { lte: new Date() } }] }, orderBy: { createdAt: "asc" }, take: parsed.data.limit, select: { id: true } });
  let succeeded = 0;
  for (const event of events) {
    try { await processDomainEvent(event.id); succeeded += 1; } catch { /* persisted for bounded retry */ }
  }
  await prisma.platformAudit.create({ data: { actorId: actor.id, action: "DOMAIN_EVENT_PROCESSING_REQUESTED", entity: "DomainEvent", metadata: { selected: events.length, succeeded } } });
  revalidatePath("/communications");
  revalidatePath("/communications/automations");
  return { ok: true, message: `Processed ${succeeded} of ${events.length} eligible events.` };
}

export async function markNotificationReadAction(formData: FormData) {
  const actor = await getCurrentUser();
  if (!actor) throw new AuthorizationError("Authentication required");
  const notificationId = formData.get("notificationId");
  if (typeof notificationId !== "string") throw new AuthorizationError("Invalid notification");
  const result = await prisma.notification.updateMany({ where: { id: notificationId, userId: actor.id, status: "UNREAD" }, data: { status: "READ", readAt: new Date() } });
  if (result.count === 0) throw new AuthorizationError("Notification not found");
  revalidatePath("/notifications");
}
