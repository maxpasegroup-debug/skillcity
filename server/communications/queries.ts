import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/server/auth/authorization";
import { automationRuleScopeWhere, communicationMessageScopeWhere, communicationTemplateScopeWhere, domainEventScopeWhere, institutionScopeWhere } from "@/server/auth/scoping";

export async function requireCommunications() {
  return requirePermission(PERMISSIONS.COMMUNICATIONS_READ);
}

export async function getCommunicationsOverview() {
  const actor = await requireCommunications();
  const messageWhere = communicationMessageScopeWhere(actor, PERMISSIONS.COMMUNICATIONS_READ);
  const eventWhere = domainEventScopeWhere(actor, PERMISSIONS.COMMUNICATIONS_READ);
  const [messages, events, counts] = await Promise.all([
    prisma.communicationMessage.findMany({ where: messageWhere, orderBy: { createdAt: "desc" }, take: 50, include: { recipient: { select: { name: true } }, templateVersion: { include: { template: { select: { code: true, name: true } } } } } }),
    prisma.domainEvent.findMany({ where: eventWhere, orderBy: { createdAt: "desc" }, take: 30, select: { id: true, type: true, aggregateType: true, status: true, attempts: true, maxAttempts: true, createdAt: true, processedAt: true, lastError: true } }),
    prisma.communicationMessage.groupBy({ by: ["status"], where: messageWhere, _count: true })
  ]);
  return { actor, messages, events, counts };
}

export async function getCommunicationTemplates() {
  const actor = await requireCommunications();
  const [templates, institutions] = await Promise.all([
    prisma.communicationTemplate.findMany({ where: communicationTemplateScopeWhere(actor, PERMISSIONS.COMMUNICATIONS_READ), orderBy: { updatedAt: "desc" }, include: { institution: { select: { name: true } }, versions: { orderBy: { version: "desc" }, take: 1 } } }),
    prisma.institution.findMany({ where: institutionScopeWhere(actor, hasPermission(actor, PERMISSIONS.COMMUNICATION_TEMPLATES_MANAGE) ? PERMISSIONS.COMMUNICATION_TEMPLATES_MANAGE : PERMISSIONS.COMMUNICATIONS_READ), orderBy: { name: "asc" }, select: { id: true, name: true } })
  ]);
  return { actor, templates, institutions, canManage: hasPermission(actor, PERMISSIONS.COMMUNICATION_TEMPLATES_MANAGE) };
}

export async function getAutomationOperations() {
  const actor = await requireCommunications();
  const permission = hasPermission(actor, PERMISSIONS.AUTOMATIONS_READ) ? PERMISSIONS.AUTOMATIONS_READ : PERMISSIONS.COMMUNICATIONS_READ;
  const [rules, executions, institutions] = await Promise.all([
    prisma.automationRule.findMany({ where: automationRuleScopeWhere(actor, permission), orderBy: { updatedAt: "desc" }, include: { institution: { select: { name: true } }, executions: { orderBy: { executedAt: "desc" }, take: 3 } } }),
    prisma.automationExecution.findMany({ where: { rule: automationRuleScopeWhere(actor, permission) }, orderBy: { executedAt: "desc" }, take: 50, include: { rule: { select: { name: true, code: true } }, domainEvent: { select: { type: true, aggregateType: true, aggregateId: true } } } }),
    prisma.institution.findMany({ where: institutionScopeWhere(actor, hasPermission(actor, PERMISSIONS.AUTOMATIONS_MANAGE) ? PERMISSIONS.AUTOMATIONS_MANAGE : PERMISSIONS.COMMUNICATIONS_READ), orderBy: { name: "asc" }, select: { id: true, name: true } })
  ]);
  return { actor, rules, executions, institutions, canManage: hasPermission(actor, PERMISSIONS.AUTOMATIONS_MANAGE) };
}
