import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS, type AuthorizationUser, type PermissionKey } from "@/lib/auth/permissions";
import { resolveConversationalAssistantEntryPoint } from "@/lib/auth/v2-governance";
import { requirePermission } from "@/server/auth/authorization";
import { filterAuthorizedAIProposals } from "@/server/ai/governance";
import { applicationScopeWhere, batchScopeWhere, careerOpportunityScopeWhere, employeeScopeWhere, feeInvoiceScopeWhere, labsProductScopeWhere } from "@/server/auth/scoping";

export type SiaBriefingArea = {
  key: string;
  label: string;
  metric: string;
  count: number;
  href: string;
};

type AreaQuery = Omit<SiaBriefingArea, "count"> & {
  permission: PermissionKey;
  load: (actor: AuthorizationUser) => Promise<number>;
};

const AREA_QUERIES: AreaQuery[] = [
  {
    key: "people",
    label: "People & Operations",
    metric: "active employees",
    href: "/employees",
    permission: PERMISSIONS.EMPLOYEE_READ,
    load: (actor) => prisma.employee.count({ where: { AND: [employeeScopeWhere(actor, PERMISSIONS.EMPLOYEE_READ), { status: { in: ["ACTIVE", "PROBATION", "ON_NOTICE"] } }] } })
  },
  {
    key: "admissions",
    label: "Admissions & Growth",
    metric: "applications awaiting decision",
    href: "/admissions/applications",
    permission: PERMISSIONS.ADMISSIONS_ACCESS,
    load: (actor) => prisma.admissionApplication.count({ where: { AND: [applicationScopeWhere(actor, PERMISSIONS.ADMISSIONS_ACCESS), { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } }] } })
  },
  {
    key: "academic",
    label: "Academic Operations",
    metric: "active batches",
    href: "/director/batch-management",
    permission: PERMISSIONS.DIRECTOR_ACCESS,
    load: (actor) => prisma.batch.count({ where: { AND: [batchScopeWhere(actor, PERMISSIONS.DIRECTOR_ACCESS), { status: "ACTIVE" }] } })
  },
  {
    key: "finance",
    label: "Finance & Compliance",
    metric: "open invoices",
    href: "/finance",
    permission: PERMISSIONS.FINANCE_READ,
    load: (actor) => prisma.feeInvoice.count({ where: { AND: [feeInvoiceScopeWhere(actor, PERMISSIONS.FINANCE_READ), { status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } }] } })
  },
  {
    key: "technology",
    label: "Technology & Products",
    metric: "active products",
    href: "/labs",
    permission: PERMISSIONS.LABS_READ,
    load: (actor) => prisma.labsProduct.count({ where: { AND: [labsProductScopeWhere(actor, PERMISSIONS.LABS_READ), { archivedAt: null, lifecycle: { not: "ARCHIVED" } }] } })
  },
  {
    key: "career",
    label: "Career & Partnerships",
    metric: "open opportunities",
    href: "/career/manage",
    permission: PERMISSIONS.CAREER_READ,
    load: (actor) => prisma.careerOpportunity.count({ where: { AND: [careerOpportunityScopeWhere(actor, PERMISSIONS.CAREER_READ), { status: "OPEN", archivedAt: null }] } })
  }
];

export async function getSiaOperatingBriefing() {
  const actor = await requirePermission(PERMISSIONS.AI_USE);
  const authorizedAreas = AREA_QUERIES.filter((area) => hasPermission(actor, area.permission));
  const proposalQuery = hasPermission(actor, PERMISSIONS.AI_APPROVE)
    ? prisma.aIActionProposal.findMany({
        where: { status: "PENDING_APPROVAL" },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { assistant: { select: { name: true } }, actor: { select: { name: true } } }
      })
    : Promise.resolve([]);

  const [counts, unreadNotifications, channelMemberships, proposals] = await Promise.all([
    Promise.all(authorizedAreas.map((area) => area.load(actor))),
    prisma.notification.count({ where: { userId: actor.id, status: "UNREAD" } }),
    hasPermission(actor, PERMISSIONS.INTERNAL_COMMUNICATIONS_READ)
      ? prisma.internalChannelMember.count({ where: { userId: actor.id, status: "ACTIVE", channel: { archivedAt: null } } })
      : Promise.resolve(0),
    proposalQuery
  ]);

  return {
    actor,
    areas: authorizedAreas.map((area, index) => ({ key: area.key, label: area.label, metric: area.metric, href: area.href, count: counts[index] })),
    unreadNotifications,
    channelMemberships,
    proposals: filterAuthorizedAIProposals(actor, proposals),
    canApprove: hasPermission(actor, PERMISSIONS.AI_APPROVE),
    assistant: resolveConversationalAssistantEntryPoint(actor)
  };
}
