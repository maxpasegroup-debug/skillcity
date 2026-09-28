import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { retryDelay } from "@/lib/communications/policies";

const actionConfigSchema = z.object({
  recipientPayloadKey: z.literal("recipientUserId"),
  title: z.string().min(1).max(180),
  message: z.string().min(1).max(2_000),
  actionUrl: z.string().max(500).nullable().optional()
}).strict();

type EventRecord = Prisma.DomainEventGetPayload<Record<string, never>>;

function ruleMatchesScope(rule: { institutionId: string | null; divisionId: string | null; districtId: string | null; campusId: string | null; departmentId: string | null }, event: EventRecord) {
  return (!rule.institutionId || rule.institutionId === event.institutionId)
    && (!rule.divisionId || rule.divisionId === event.divisionId)
    && (!rule.districtId || rule.districtId === event.districtId)
    && (!rule.campusId || rule.campusId === event.campusId)
    && (!rule.departmentId || rule.departmentId === event.departmentId);
}

function eventPayload(event: EventRecord) {
  return event.payload && typeof event.payload === "object" && !Array.isArray(event.payload) ? event.payload as Record<string, unknown> : {};
}

async function executeNotificationRule(event: EventRecord, rule: Prisma.AutomationRuleGetPayload<Record<string, never>>) {
  const idempotencyKey = `${event.id}:${rule.id}`;
  try {
    const config = actionConfigSchema.parse(rule.actionConfig);
    const recipientUserId = eventPayload(event)[config.recipientPayloadKey];
    if (typeof recipientUserId !== "string") throw new Error("Event does not contain a valid notification recipient");

    await prisma.$transaction(async (tx) => {
      const execution = await tx.automationExecution.upsert({
        where: { idempotencyKey },
        update: { status: "PENDING", error: null, startedAt: new Date(), attempts: { increment: 1 } },
        create: { ruleId: rule.id, domainEventId: event.id, idempotencyKey, status: "PENDING", input: eventPayload(event) as Prisma.InputJsonObject, attempts: 1, maxAttempts: rule.maxAttempts, startedAt: new Date() }
      });
      const message = await tx.communicationMessage.upsert({
        where: { idempotencyKey: `automation:${idempotencyKey}` },
        update: {},
        create: {
          channel: "INTERNAL_NOTIFICATION", purpose: "OPERATIONAL", status: "DELIVERED",
          idempotencyKey: `automation:${idempotencyKey}`, recipientUserId, recipientMasked: "in-app user",
          subject: config.title, body: config.message, domainEventId: event.id, automationExecutionId: execution.id,
          institutionId: event.institutionId, divisionId: event.divisionId, districtId: event.districtId,
          campusId: event.campusId, departmentId: event.departmentId, deliveredAt: new Date()
        }
      });
      await tx.notification.upsert({
        where: { communicationMessageId: message.id },
        update: {},
        create: { userId: recipientUserId, communicationMessageId: message.id, type: "SYSTEM", title: config.title, message: config.message, actionUrl: config.actionUrl ?? null }
      });
      await tx.automationExecution.update({ where: { id: execution.id }, data: { status: "SUCCESS", completedAt: new Date(), output: { communicationMessageId: message.id } } });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 2_000) : "Automation execution failed";
    await prisma.automationExecution.upsert({
      where: { idempotencyKey },
      update: { status: "FAILED", error: message, completedAt: new Date(), attempts: { increment: 1 }, nextAttemptAt: new Date(Date.now() + retryDelay(event.attempts + 1)) },
      create: { ruleId: rule.id, domainEventId: event.id, idempotencyKey, status: "FAILED", input: eventPayload(event) as Prisma.InputJsonObject, error: message, attempts: 1, maxAttempts: rule.maxAttempts, completedAt: new Date(), nextAttemptAt: new Date(Date.now() + retryDelay(1)) }
    });
    throw error;
  }
}

export async function processDomainEvent(eventId: string) {
  const event = await prisma.domainEvent.findUniqueOrThrow({ where: { id: eventId } });
  if (event.status === "PROCESSED" || event.status === "DEAD_LETTER") return event;
  await prisma.domainEvent.update({ where: { id: event.id }, data: { status: "PROCESSING", attempts: { increment: 1 }, lastError: null } });
  try {
    const rules = await prisma.automationRule.findMany({ where: { triggerType: "EVENT", eventType: event.type, active: true } });
    for (const rule of rules.filter((item) => ruleMatchesScope(item, event))) {
      if (rule.actionType !== "SEND_NOTIFICATION") throw new Error(`Unsupported event action: ${rule.actionType}`);
      await executeNotificationRule(event, rule);
    }
    return prisma.domainEvent.update({ where: { id: event.id }, data: { status: "PROCESSED", processedAt: new Date() } });
  } catch (error) {
    const attempts = event.attempts + 1;
    const exhausted = attempts >= event.maxAttempts;
    await prisma.domainEvent.update({
      where: { id: event.id },
      data: { status: exhausted ? "DEAD_LETTER" : "FAILED", availableAt: exhausted ? event.availableAt : new Date(Date.now() + retryDelay(attempts)), lastError: error instanceof Error ? error.message.slice(0, 2_000) : "Automation execution failed" }
    });
    throw error;
  }
}

export async function processPendingDomainEvents(limit = 10) {
  const events = await prisma.domainEvent.findMany({ where: { status: { in: ["PENDING", "FAILED"] }, availableAt: { lte: new Date() } }, orderBy: { createdAt: "asc" }, take: limit });
  const results = [];
  for (const event of events) {
    try { await processDomainEvent(event.id); results.push({ id: event.id, ok: true }); }
    catch { results.push({ id: event.id, ok: false }); }
  }
  return results;
}
