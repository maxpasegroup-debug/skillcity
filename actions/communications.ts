"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { canAccessResource, PERMISSIONS, type AuthorizationUser } from "@/lib/auth/permissions";
import { normalizeCommunicationCode, templateVariables } from "@/lib/communications/policies";
import { canPostInternalMessage, employeeChannelCompatibilityWhere, isActiveInternalCommunicationEmployee, uniqueChannelMemberIds, type InternalChannelScope } from "@/lib/communications/internal-channels";
import { communicationTemplateSchema, eventAutomationSchema, internalChannelIdSchema, internalChannelMemberRoleSchema, internalChannelMemberSchema, internalChannelSchema, internalMessageSchema, processEventsSchema } from "@/features/communications/schemas";
import { assertPermission, AuthorizationError } from "@/server/auth/authorization";
import { getCurrentUser } from "@/server/auth/session";
import { domainEventScopeWhere, employeeScopeWhere } from "@/server/auth/scoping";
import { validateOrganizationPathForActor } from "@/server/organization/service";
import { processDomainEvent } from "@/server/communications/automation";

export type CommunicationActionState = { ok: boolean; message: string };
const failure = (message: string): CommunicationActionState => ({ ok: false, message });
const optional = (value?: string) => value?.trim() || null;

function assertActiveCommunicationEmployee(actor: AuthorizationUser) {
  if (!isActiveInternalCommunicationEmployee(actor)) throw new AuthorizationError("Active Employee profile required for internal communications");
}

async function assertEligibleChannelMembers(actor: AuthorizationUser, memberIds: string[], path: InternalChannelScope) {
  const uniqueIds = uniqueChannelMemberIds(memberIds, actor.id);
  if (uniqueIds.length === 0) return uniqueIds;
  const eligible = await prisma.employee.findMany({
    where: {
      AND: [
        employeeScopeWhere(actor, PERMISSIONS.INTERNAL_COMMUNICATIONS_MANAGE),
        employeeChannelCompatibilityWhere(path),
        { status: { in: ["ACTIVE", "PROBATION", "ON_NOTICE"] }, userId: { in: uniqueIds }, user: { status: "ACTIVE", deletedAt: null } }
      ]
    },
    select: { userId: true }
  });
  if (eligible.length !== uniqueIds.length) throw new AuthorizationError("One or more channel members are outside the authorized organization scope");
  return uniqueIds;
}

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

export async function createInternalChannelAction(_: CommunicationActionState, formData: FormData): Promise<CommunicationActionState> {
  const actor = await assertPermission(PERMISSIONS.INTERNAL_COMMUNICATIONS_MANAGE);
  assertActiveCommunicationEmployee(actor);
  const parsed = internalChannelSchema.safeParse({ ...Object.fromEntries(formData), memberIds: formData.getAll("memberIds") });
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Check channel details.");
  const data = parsed.data;
  const path = { institutionId: data.institutionId, divisionId: optional(data.divisionId), districtId: optional(data.districtId), campusId: optional(data.campusId), departmentId: optional(data.departmentId) };
  await validateOrganizationPathForActor(actor, PERMISSIONS.INTERNAL_COMMUNICATIONS_MANAGE, path);
  const memberIds = await assertEligibleChannelMembers(actor, data.memberIds, path);
  const channel = await prisma.$transaction(async (tx) => {
    const created = await tx.internalChannel.create({
      data: {
        ...path,
        name: data.name,
        description: optional(data.description),
        type: data.type,
        createdById: actor.id,
        members: { create: [{ userId: actor.id, role: "OWNER" }, ...memberIds.map((userId) => ({ userId, role: "MEMBER" as const }))] }
      }
    });
    await tx.platformAudit.create({ data: { actorId: actor.id, action: "INTERNAL_CHANNEL_CREATED", entity: "InternalChannel", entityId: created.id, metadata: { type: data.type, memberCount: memberIds.length + 1 } } });
    return created;
  });
  revalidatePath("/communications/channels");
  return { ok: true, message: `Channel created: ${channel.name}` };
}

export async function addInternalChannelMemberAction(_: CommunicationActionState, formData: FormData): Promise<CommunicationActionState> {
  const actor = await assertPermission(PERMISSIONS.INTERNAL_COMMUNICATIONS_MANAGE);
  assertActiveCommunicationEmployee(actor);
  const parsed = internalChannelMemberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Invalid channel member.");
  const channel = await prisma.internalChannel.findUnique({ where: { id: parsed.data.channelId } });
  if (!channel || channel.archivedAt || !canAccessResource(actor, PERMISSIONS.INTERNAL_COMMUNICATIONS_MANAGE, channel)) throw new AuthorizationError();
  await assertEligibleChannelMembers(actor, [parsed.data.userId], channel);
  await prisma.$transaction([
    prisma.internalChannelMember.upsert({ where: { channelId_userId: parsed.data }, update: { status: "ACTIVE" }, create: { ...parsed.data, role: "MEMBER" } }),
    prisma.platformAudit.create({ data: { actorId: actor.id, action: "INTERNAL_CHANNEL_MEMBER_ADDED", entity: "InternalChannel", entityId: channel.id, metadata: { userId: parsed.data.userId } } })
  ]);
  revalidatePath(`/communications/channels/${channel.id}`);
  return { ok: true, message: "Member added." };
}

export async function sendInternalMessageAction(_: CommunicationActionState, formData: FormData): Promise<CommunicationActionState> {
  const actor = await assertPermission(PERMISSIONS.INTERNAL_COMMUNICATIONS_SEND);
  assertActiveCommunicationEmployee(actor);
  const parsed = internalMessageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Check message.");
  const membership = await prisma.internalChannelMember.findFirst({ where: { channelId: parsed.data.channelId, userId: actor.id, status: "ACTIVE", channel: { archivedAt: null } }, include: { channel: { include: { members: { where: { status: "ACTIVE", userId: { not: actor.id } }, select: { userId: true } } } } } });
  if (!membership) throw new AuthorizationError("Channel membership required");
  if (!canPostInternalMessage(membership.channel.type, membership.role)) throw new AuthorizationError("Only channel owners and moderators can publish announcements");
  await prisma.$transaction(async (tx) => {
    const message = await tx.internalMessage.create({ data: { channelId: membership.channelId, authorId: actor.id, body: parsed.data.body } });
    if (membership.channel.members.length > 0) {
      await tx.notification.createMany({ data: membership.channel.members.map(({ userId }) => ({ userId, type: membership.channel.type === "ANNOUNCEMENT" ? "ANNOUNCEMENT" as const : "ACTIVITY" as const, title: membership.channel.name, message: parsed.data.body.slice(0, 500), actionUrl: `/communications/channels/${membership.channelId}` })) });
    }
    await tx.platformAudit.create({ data: { actorId: actor.id, action: "INTERNAL_MESSAGE_SENT", entity: "InternalMessage", entityId: message.id, metadata: { channelId: membership.channelId, recipientCount: membership.channel.members.length } } });
  });
  revalidatePath(`/communications/channels/${membership.channelId}`);
  revalidatePath("/notifications");
  return { ok: true, message: "Message sent." };
}

export async function setInternalChannelMemberRoleAction(formData: FormData) {
  const actor = await assertPermission(PERMISSIONS.INTERNAL_COMMUNICATIONS_MANAGE);
  assertActiveCommunicationEmployee(actor);
  const parsed = internalChannelMemberRoleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new AuthorizationError("Invalid channel member role");
  const membership = await prisma.internalChannelMember.findUnique({ where: { channelId_userId: { channelId: parsed.data.channelId, userId: parsed.data.userId } }, include: { channel: true } });
  if (!membership || membership.status !== "ACTIVE" || membership.role === "OWNER" || !canAccessResource(actor, PERMISSIONS.INTERNAL_COMMUNICATIONS_MANAGE, membership.channel)) throw new AuthorizationError();
  await prisma.$transaction([
    prisma.internalChannelMember.update({ where: { id: membership.id }, data: { role: parsed.data.role } }),
    prisma.platformAudit.create({ data: { actorId: actor.id, action: "INTERNAL_CHANNEL_MEMBER_ROLE_UPDATED", entity: "InternalChannel", entityId: membership.channelId, metadata: { userId: membership.userId, role: parsed.data.role } } })
  ]);
  revalidatePath(`/communications/channels/${membership.channelId}`);
}

export async function deactivateInternalChannelMemberAction(formData: FormData) {
  const actor = await assertPermission(PERMISSIONS.INTERNAL_COMMUNICATIONS_MANAGE);
  assertActiveCommunicationEmployee(actor);
  const parsed = internalChannelMemberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new AuthorizationError("Invalid channel member");
  const membership = await prisma.internalChannelMember.findUnique({ where: { channelId_userId: parsed.data }, include: { channel: true } });
  if (!membership || membership.role === "OWNER" || !canAccessResource(actor, PERMISSIONS.INTERNAL_COMMUNICATIONS_MANAGE, membership.channel)) throw new AuthorizationError("Channel owner cannot be removed");
  await prisma.$transaction([
    prisma.internalChannelMember.update({ where: { id: membership.id }, data: { status: "INACTIVE" } }),
    prisma.platformAudit.create({ data: { actorId: actor.id, action: "INTERNAL_CHANNEL_MEMBER_DEACTIVATED", entity: "InternalChannel", entityId: membership.channelId, metadata: { userId: membership.userId } } })
  ]);
  revalidatePath(`/communications/channels/${membership.channelId}`);
}

export async function markInternalChannelReadAction(formData: FormData) {
  const actor = await assertPermission(PERMISSIONS.INTERNAL_COMMUNICATIONS_READ);
  assertActiveCommunicationEmployee(actor);
  const parsed = internalChannelIdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new AuthorizationError("Invalid channel");
  const updated = await prisma.internalChannelMember.updateMany({ where: { channelId: parsed.data.channelId, userId: actor.id, status: "ACTIVE" }, data: { lastReadAt: new Date() } });
  if (updated.count === 0) throw new AuthorizationError("Channel membership required");
  revalidatePath(`/communications/channels/${parsed.data.channelId}`);
}

export async function archiveInternalChannelAction(formData: FormData) {
  const actor = await assertPermission(PERMISSIONS.INTERNAL_COMMUNICATIONS_MANAGE);
  assertActiveCommunicationEmployee(actor);
  const parsed = internalChannelIdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new AuthorizationError("Invalid channel");
  const channel = await prisma.internalChannel.findUnique({ where: { id: parsed.data.channelId } });
  if (!channel || !canAccessResource(actor, PERMISSIONS.INTERNAL_COMMUNICATIONS_MANAGE, channel)) throw new AuthorizationError();
  await prisma.$transaction([
    prisma.internalChannel.update({ where: { id: channel.id }, data: { archivedAt: new Date() } }),
    prisma.platformAudit.create({ data: { actorId: actor.id, action: "INTERNAL_CHANNEL_ARCHIVED", entity: "InternalChannel", entityId: channel.id } })
  ]);
  revalidatePath("/communications/channels");
}
