import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { comparablePercentChange, protectMixedCurrency, resolveAnalyticsRange, safePercentage, type AnalyticsPeriod, type CurrencySummary } from "@/lib/analytics/metrics";
import { PERMISSIONS, resolveAuthorizedScopes, type AuthorizationUser } from "@/lib/auth/permissions";
import { requirePermission } from "@/server/auth/authorization";
import {
  applicationScopeWhere, automationRuleScopeWhere, batchScopeWhere, campusScopeWhere, careerEmployerScopeWhere,
  careerOpportunityApplicationScopeWhere, careerOpportunityScopeWhere, communicationMessageScopeWhere,
  complianceRecordScopeWhere, coreDocumentScopeWhere, departmentScopeWhere, districtScopeWhere, divisionScopeWhere, domainEventScopeWhere,
  employeeScopeWhere, enrollmentScopeWhere, feeInvoiceScopeWhere, institutionScopeWhere, labsProductScopeWhere,
  leadScopeWhere, programScopeWhere
} from "@/server/auth/scoping";

const permission = PERMISSIONS.EXECUTIVE_ACCESS;
const activeEmployeeStatuses = ["ACTIVE", "PROBATION", "ON_LEAVE", "ON_NOTICE"] as const;
const activeProductLifecycles = ["BUILDING", "PILOT", "LIVE", "MAINTENANCE"] as const;
const outstandingInvoiceStatuses = ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] as const;

function dateFilter(start: Date, end: Date) { return { gte: start, lt: end }; }

function authorizedUserWhere(actor: AuthorizationUser, employeeScope: Prisma.EmployeeWhereInput, enrollmentScope: Prisma.StudentEnrollmentWhereInput): Prisma.UserWhereInput {
  if (resolveAuthorizedScopes(actor, permission).global) return {};
  return { OR: [{ id: actor.id }, { employeeProfile: employeeScope }, { enrollments: { some: enrollmentScope } }] };
}

async function paymentSummaries(invoiceScope: Prisma.FeeInvoiceWhereInput, range: { start: Date; end: Date }, currencies: Array<string | null>, invoiceGroups: Array<{ currency: string | null; status: string; _count: number; _sum: { total: number | null } }>): Promise<CurrencySummary[]> {
  return Promise.all(currencies.map(async (currency) => {
    const payments = await prisma.paymentTransaction.aggregate({
      where: { status: "SUCCESS", paidAt: dateFilter(range.start, range.end), invoice: { AND: [invoiceScope, { currency }] } },
      _sum: { amount: true }, _count: true
    });
    const matching = invoiceGroups.filter((row) => row.currency === currency);
    return {
      currency,
      invoiced: matching.reduce((sum, row) => sum + (row._sum.total ?? 0), 0),
      outstanding: matching.filter((row) => outstandingInvoiceStatuses.includes(row.status as typeof outstandingInvoiceStatuses[number])).reduce((sum, row) => sum + (row._sum.total ?? 0), 0),
      paid: payments._sum.amount ?? 0,
      payments: payments._count
    };
  }));
}

export async function getExecutiveIntelligence(periodInput?: string, now = new Date()) {
  const actor = await requirePermission(permission, "/admin-login");
  const range = resolveAnalyticsRange(periodInput, now);
  const current = dateFilter(range.start, range.end);
  const previous = dateFilter(range.previousStart, range.previousEnd);
  const leadScope = leadScopeWhere(actor, permission);
  const applicationScope = applicationScopeWhere(actor, permission);
  const programScope = programScopeWhere(actor, permission);
  const batchScope = batchScopeWhere(actor, permission);
  const enrollmentScope = enrollmentScopeWhere(actor, permission);
  const employeeScope = employeeScopeWhere(actor, permission);
  const productScope = labsProductScopeWhere(actor, permission);
  const opportunityScope = careerOpportunityScopeWhere(actor, permission);
  const opportunityApplicationScope = careerOpportunityApplicationScopeWhere(actor, permission);
  const employerScope = careerEmployerScopeWhere(actor, permission);
  const invoiceScope = feeInvoiceScopeWhere(actor, permission);
  const complianceScope = complianceRecordScopeWhere(actor, permission);
  const documentScope = coreDocumentScopeWhere(actor, permission);
  const communicationScope = communicationMessageScopeWhere(actor, permission);
  const automationScope = automationRuleScopeWhere(actor, permission);
  const userScope = authorizedUserWhere(actor, employeeScope, enrollmentScope);
  const resolved = resolveAuthorizedScopes(actor, permission);
  const advisorScope: Prisma.AcademicAdvisorAssignmentWhereInput = resolved.global ? {} : { OR: [{ batch: batchScope }, { student: { enrollments: { some: enrollmentScope } } }] };
  const talentScope: Prisma.CareerTalentProfileWhereInput = resolved.global ? {} : { OR: [{ user: { employeeProfile: employeeScope } }, { applications: { some: { opportunity: opportunityScope } } }] };

  const [
    leads, previousLeads, applications, previousApplications, counselling, enrollments, previousEnrollments,
    activeProgramsByDomain, startupBatches, skillStudioBatches, startupEnrollments, skillStudioEnrollments, startupTrainers, skillStudioTrainers, activeEnrollments, advisorAssignments,
    productLifecycle, productType, productOwners, productContributors,
    talentProfiles, opportunities, opportunityApplications, applicationStatuses, referrals, verifiedEmployers,
    employeeStatuses, employeeDesignations, organizationAssignments,
    invoiceCurrencies, invoiceGroups, complianceStatuses, expiringCompliance, expiredCompliance, documentCategories,
    communicationStatuses, automationStatuses, failedEvents,
    aiUsage, aiAssistants, aiProposals, aiToolUsage,
    institutions, divisions, districts, campuses, departments,
    overdueInvoices, pendingApplications
  ] = await Promise.all([
    prisma.lead.count({ where: { AND: [leadScope, { createdAt: current }] } }),
    prisma.lead.count({ where: { AND: [leadScope, { createdAt: previous }] } }),
    prisma.admissionApplication.count({ where: { AND: [applicationScope, { createdAt: current }] } }),
    prisma.admissionApplication.count({ where: { AND: [applicationScope, { createdAt: previous }] } }),
    prisma.counsellingSession.count({ where: { lead: leadScope, scheduledAt: current } }),
    prisma.studentEnrollment.count({ where: { AND: [enrollmentScope, { startedAt: current }] } }),
    prisma.studentEnrollment.count({ where: { AND: [enrollmentScope, { startedAt: previous }] } }),
    prisma.program.groupBy({ by: ["operatingDomain"], where: { AND: [programScope, { status: "ACTIVE", deletedAt: null }] }, _count: true }),
    prisma.batch.count({ where: { AND: [batchScope, { status: "ACTIVE", program: { operatingDomain: "STARTUP_SCHOOL" } }] } }),
    prisma.batch.count({ where: { AND: [batchScope, { status: "ACTIVE", program: { operatingDomain: "SKILL_STUDIO" } }] } }),
    prisma.studentEnrollment.count({ where: { AND: [enrollmentScope, { status: "ACTIVE", program: { operatingDomain: "STARTUP_SCHOOL" } }] } }),
    prisma.studentEnrollment.count({ where: { AND: [enrollmentScope, { status: "ACTIVE", program: { operatingDomain: "SKILL_STUDIO" } }] } }),
    prisma.trainerAssignment.count({ where: { status: "ACTIVE", batch: { AND: [batchScope, { program: { operatingDomain: "STARTUP_SCHOOL" } }] } } }),
    prisma.trainerAssignment.count({ where: { status: "ACTIVE", batch: { AND: [batchScope, { program: { operatingDomain: "SKILL_STUDIO" } }] } } }),
    prisma.studentEnrollment.count({ where: { AND: [enrollmentScope, { status: "ACTIVE" }] } }),
    prisma.academicAdvisorAssignment.count({ where: { AND: [advisorScope, { status: "ACTIVE", startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] }] } }),
    prisma.labsProduct.groupBy({ by: ["lifecycle"], where: productScope, _count: true }),
    prisma.labsProduct.groupBy({ by: ["type"], where: productScope, _count: true }),
    prisma.labsProductAssignment.count({ where: { product: productScope, role: "OWNER", status: "ACTIVE", startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] } }),
    prisma.labsProductAssignment.count({ where: { product: productScope, role: "CONTRIBUTOR", status: "ACTIVE", startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] } }),
    prisma.careerTalentProfile.count({ where: talentScope }),
    prisma.careerOpportunity.count({ where: { AND: [opportunityScope, { status: "OPEN", archivedAt: null }] } }),
    prisma.careerOpportunityApplication.count({ where: { AND: [opportunityApplicationScope, { submittedAt: current }] } }),
    prisma.careerOpportunityApplication.groupBy({ by: ["status"], where: opportunityApplicationScope, _count: true }),
    prisma.careerReferral.count({ where: { opportunity: opportunityScope, status: "ACTIVE" } }),
    prisma.careerEmployer.count({ where: { AND: [employerScope, { status: "VERIFIED" }] } }),
    prisma.employee.groupBy({ by: ["status"], where: employeeScope, _count: true }),
    prisma.employee.groupBy({ by: ["designationId"], where: { AND: [employeeScope, { status: { in: [...activeEmployeeStatuses] } }] }, _count: true }),
    prisma.employeeOrganizationAssignment.count({ where: { employee: employeeScope, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] } }),
    prisma.feeInvoice.groupBy({ by: ["currency"], where: invoiceScope, _count: true }),
    prisma.feeInvoice.groupBy({ by: ["currency", "status"], where: { AND: [invoiceScope, { createdAt: current }] }, _count: true, _sum: { total: true } }),
    prisma.complianceRecord.groupBy({ by: ["status"], where: complianceScope, _count: true }),
    prisma.complianceRecord.count({ where: { AND: [complianceScope, { archivedAt: null, expiresAt: { gt: now, lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) } }] } }),
    prisma.complianceRecord.count({ where: { AND: [complianceScope, { archivedAt: null, expiresAt: { lte: now } }] } }),
    prisma.coreDocument.groupBy({ by: ["category"], where: { AND: [documentScope, { status: "ACTIVE" }] }, _count: true }),
    prisma.communicationMessage.groupBy({ by: ["status"], where: { AND: [communicationScope, { createdAt: current }] }, _count: true }),
    prisma.automationExecution.groupBy({ by: ["status"], where: { rule: automationScope, executedAt: current }, _count: true }),
    prisma.domainEvent.count({ where: { AND: [domainEventScopeWhere(actor, permission), { status: { in: ["FAILED", "DEAD_LETTER"] }, createdAt: current }] } }),
    prisma.aIUsageLog.aggregate({ where: { user: userScope, createdAt: current }, _count: true, _sum: { inputTokens: true, outputTokens: true } }),
    prisma.aIAssistant.count({ where: { status: "ACTIVE", usageLogs: { some: { user: userScope, createdAt: current } } } }),
    prisma.aIActionProposal.groupBy({ by: ["status"], where: { actor: userScope, createdAt: current }, _count: true }),
    prisma.platformAudit.count({ where: { action: "AI_READ_TOOL_EXECUTED", actor: userScope, createdAt: current } }),
    prisma.institution.count({ where: institutionScopeWhere(actor, permission) }),
    prisma.division.count({ where: divisionScopeWhere(actor, permission) }),
    prisma.district.count({ where: districtScopeWhere(actor, permission) }),
    prisma.campus.count({ where: campusScopeWhere(actor, permission) }),
    prisma.department.count({ where: departmentScopeWhere(actor, permission) }),
    prisma.feeInvoice.count({ where: { AND: [invoiceScope, { status: { in: [...outstandingInvoiceStatuses] }, dueAt: { lt: now } }] } }),
    prisma.admissionApplication.count({ where: { AND: [applicationScope, { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } }] } })
  ]);

  const currency = await paymentSummaries(invoiceScope, range, invoiceCurrencies.map((row) => row.currency), invoiceGroups);
  const financeHeadline = protectMixedCurrency(currency);
  const activeEmployees = employeeStatuses.filter((row) => activeEmployeeStatuses.includes(row.status as typeof activeEmployeeStatuses[number])).reduce((sum, row) => sum + row._count, 0);
  const totalProducts = productLifecycle.reduce((sum, row) => sum + row._count, 0);
  const activeProducts = productLifecycle.filter((row) => activeProductLifecycles.includes(row.lifecycle as typeof activeProductLifecycles[number])).reduce((sum, row) => sum + row._count, 0);
  const communicationSent = communicationStatuses.filter((row) => ["SENT", "DELIVERED", "READ"].includes(row.status)).reduce((sum, row) => sum + row._count, 0);
  const communicationDelivered = communicationStatuses.filter((row) => ["DELIVERED", "READ"].includes(row.status)).reduce((sum, row) => sum + row._count, 0);
  const communicationFailed = communicationStatuses.find((row) => row.status === "FAILED")?._count ?? 0;
  const automationFailed = automationStatuses.find((row) => row.status === "FAILED")?._count ?? 0;
  const proposal = Object.fromEntries(aiProposals.map((row) => [row.status, row._count]));
  const activePrograms = Object.fromEntries(activeProgramsByDomain.map((row) => [row.operatingDomain ?? "UNCLASSIFIED", row._count]));

  return {
    actor,
    range,
    overview: {
      leads: { value: leads, previous: previousLeads, changePercent: comparablePercentChange(leads, previousLeads) },
      applications: { value: applications, previous: previousApplications, changePercent: comparablePercentChange(applications, previousApplications) },
      enrollments: { value: enrollments, previous: previousEnrollments, changePercent: comparablePercentChange(enrollments, previousEnrollments) },
      activeLearners: activeEnrollments,
      activeEmployees,
      activeProducts,
      openOpportunities: opportunities,
      finance: financeHeadline
    },
    admissions: { leads, applications, counselling, enrollments, conversionPercent: safePercentage(applications, leads), pendingApplications },
    learning: {
      activePrograms,
      activeBatches: startupBatches + skillStudioBatches,
      activeEnrollments,
      trainerAssignments: startupTrainers + skillStudioTrainers,
      advisorAssignments,
      startupSchool: { activePrograms: activePrograms.STARTUP_SCHOOL ?? 0, activeBatches: startupBatches, activeEnrollments: startupEnrollments, trainerAssignments: startupTrainers },
      skillStudio: { activePrograms: activePrograms.SKILL_STUDIO ?? 0, activeBatches: skillStudioBatches, activeEnrollments: skillStudioEnrollments, trainerAssignments: skillStudioTrainers }
    },
    labs: { totalProducts, activeProducts, lifecycle: productLifecycle.map((row) => ({ key: row.lifecycle, count: row._count })), types: productType.map((row) => ({ key: row.type, count: row._count })), owners: productOwners, contributors: productContributors },
    career: { talentProfiles, openOpportunities: opportunities, applications: opportunityApplications, applicationStatuses: applicationStatuses.map((row) => ({ key: row.status, count: row._count })), referrals, verifiedEmployers },
    people: { activeEmployees, statuses: employeeStatuses.map((row) => ({ key: row.status, count: row._count })), designationGroups: employeeDesignations.length, organizationAssignments },
    finance: { currencies: currency, headline: financeHeadline },
    operations: { compliance: complianceStatuses.map((row) => ({ key: row.status, count: row._count })), expiringCompliance, expiredCompliance, documentCategories: documentCategories.map((row) => ({ key: row.category, count: row._count })), communications: communicationStatuses.map((row) => ({ key: row.status, count: row._count })), communicationSent, communicationDelivered, communicationFailed, automation: automationStatuses.map((row) => ({ key: row.status, count: row._count })), automationFailed, failedEvents },
    ai: { requests: aiUsage._count, assistantsUsed: aiAssistants, measuredInputTokens: aiUsage._sum.inputTokens, measuredOutputTokens: aiUsage._sum.outputTokens, toolExecutions: aiToolUsage, pendingProposals: proposal.PENDING_APPROVAL ?? 0, approvedProposals: proposal.APPROVED ?? 0, rejectedProposals: proposal.REJECTED ?? 0 },
    organization: { institutions, divisions, districts, campuses, departments },
    attention: [
      { code: "finance.overdue-invoices", label: "Overdue invoices", count: overdueInvoices, href: "/finance/invoices" },
      { code: "compliance.expiring", label: "Compliance expiring within 30 days", count: expiringCompliance, href: "/compliance" },
      { code: "communications.failed", label: "Failed communications in period", count: communicationFailed, href: "/communications" },
      { code: "automations.failed", label: "Failed automations in period", count: automationFailed, href: "/communications/automations" },
      { code: "ai.pending-proposals", label: "AI proposals awaiting review", count: proposal.PENDING_APPROVAL ?? 0, href: "/ai" }
    ].filter((item) => item.count > 0)
  };
}

export type ExecutiveIntelligence = Awaited<ReturnType<typeof getExecutiveIntelligence>>;
export type ExecutiveAnalyticsPeriod = AnalyticsPeriod;
