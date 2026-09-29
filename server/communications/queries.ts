import { prisma } from "@/lib/prisma";
import { canAccessResource, PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { employeeChannelCompatibilityWhere, isActiveInternalCommunicationEmployee } from "@/lib/communications/internal-channels";
import { AuthorizationError, requirePermission } from "@/server/auth/authorization";
import { automationRuleScopeWhere, campusScopeWhere, communicationMessageScopeWhere, communicationTemplateScopeWhere, departmentScopeWhere, districtScopeWhere, divisionScopeWhere, domainEventScopeWhere, employeeScopeWhere, institutionScopeWhere } from "@/server/auth/scoping";

export async function requireCommunications() {
  return requirePermission(PERMISSIONS.COMMUNICATIONS_READ);
}

export async function requireInternalCommunications() {
  const actor = await requirePermission(PERMISSIONS.INTERNAL_COMMUNICATIONS_READ);
  if (!isActiveInternalCommunicationEmployee(actor)) throw new AuthorizationError("Active Employee profile required for internal communications");
  return actor;
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

export async function getInternalChannelDirectory() {
  const actor = await requireInternalCommunications();
  const canManage = hasPermission(actor, PERMISSIONS.INTERNAL_COMMUNICATIONS_MANAGE);
  const [memberships, institutions, divisions, districts, campuses, departments, employees] = await Promise.all([
    prisma.internalChannelMember.findMany({
      where: { userId: actor.id, status: "ACTIVE", channel: { archivedAt: null } },
      orderBy: { channel: { updatedAt: "desc" } },
      include: {
        channel: {
          include: {
            institution: { select: { name: true } },
            messages: { orderBy: { createdAt: "desc" }, take: 1, include: { author: { select: { name: true } } } },
            _count: { select: { members: true, messages: true } }
          }
        }
      }
    }),
    canManage ? prisma.institution.findMany({ where: institutionScopeWhere(actor, PERMISSIONS.INTERNAL_COMMUNICATIONS_MANAGE), orderBy: { name: "asc" }, select: { id: true, name: true } }) : [],
    canManage ? prisma.division.findMany({ where: divisionScopeWhere(actor, PERMISSIONS.INTERNAL_COMMUNICATIONS_MANAGE), orderBy: { name: "asc" }, select: { id: true, name: true, institutionId: true } }) : [],
    canManage ? prisma.district.findMany({ where: districtScopeWhere(actor, PERMISSIONS.INTERNAL_COMMUNICATIONS_MANAGE), orderBy: [{ stateName: "asc" }, { name: "asc" }], select: { id: true, name: true, stateName: true, institutionId: true } }) : [],
    canManage ? prisma.campus.findMany({ where: campusScopeWhere(actor, PERMISSIONS.INTERNAL_COMMUNICATIONS_MANAGE), orderBy: { name: "asc" }, select: { id: true, name: true, institutionId: true, districtId: true } }) : [],
    canManage ? prisma.department.findMany({ where: departmentScopeWhere(actor, PERMISSIONS.INTERNAL_COMMUNICATIONS_MANAGE), orderBy: { name: "asc" }, select: { id: true, name: true, institutionId: true, divisionId: true, campusId: true } }) : [],
    canManage ? prisma.employee.findMany({ where: { AND: [employeeScopeWhere(actor, PERMISSIONS.INTERNAL_COMMUNICATIONS_MANAGE), { status: { in: ["ACTIVE", "PROBATION", "ON_NOTICE"] }, user: { status: "ACTIVE", deletedAt: null } }] }, orderBy: { user: { name: "asc" } }, select: { userId: true, employeeCode: true, user: { select: { name: true } }, designation: { select: { name: true } } } }) : []
  ]);
  return { actor, memberships, institutions, divisions, districts, campuses, departments, employees, canManage };
}

export async function getInternalChannelDetail(channelId: string) {
  const actor = await requireInternalCommunications();
  const membership = await prisma.internalChannelMember.findFirst({
    where: { channelId, userId: actor.id, status: "ACTIVE", channel: { archivedAt: null } },
    include: {
      channel: {
        include: {
          institution: { select: { name: true } },
          division: { select: { name: true } },
          district: { select: { name: true } },
          campus: { select: { name: true } },
          department: { select: { name: true } },
          members: { where: { status: "ACTIVE" }, orderBy: [{ role: "asc" }, { user: { name: "asc" } }], include: { user: { select: { id: true, name: true } } } },
          messages: { orderBy: { createdAt: "asc" }, take: 100, include: { author: { select: { id: true, name: true } } } }
        }
      }
    }
  });
  if (!membership) return null;
  const canManage = hasPermission(actor, PERMISSIONS.INTERNAL_COMMUNICATIONS_MANAGE)
    && canAccessResource(actor, PERMISSIONS.INTERNAL_COMMUNICATIONS_MANAGE, membership.channel);
  const employees = canManage ? await prisma.employee.findMany({ where: { AND: [employeeScopeWhere(actor, PERMISSIONS.INTERNAL_COMMUNICATIONS_MANAGE), employeeChannelCompatibilityWhere(membership.channel), { status: { in: ["ACTIVE", "PROBATION", "ON_NOTICE"] }, user: { status: "ACTIVE", deletedAt: null }, userId: { notIn: membership.channel.members.map((item) => item.userId) } }] }, orderBy: { user: { name: "asc" } }, select: { userId: true, user: { select: { name: true } }, designation: { select: { name: true } } } }) : [];
  return { actor, membership, channel: membership.channel, canManage, employees };
}
