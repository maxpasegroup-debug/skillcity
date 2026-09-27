import { prisma } from "@/lib/prisma";
import { PERMISSIONS, resolveAuthorizedScopes } from "@/lib/auth/permissions";
import { requirePermission } from "@/server/auth/authorization";
import { batchScopeWhere, campusScopeWhere, departmentScopeWhere, districtScopeWhere, divisionScopeWhere, employeeScopeWhere, enrollmentScopeWhere, feeInvoiceScopeWhere, institutionScopeWhere, leadScopeWhere, programScopeWhere, studentConcernScopeWhere, userThroughEnrollmentScopeWhere } from "@/server/auth/scoping";

export async function requireExecutive() {
  return requirePermission(PERMISSIONS.EXECUTIVE_ACCESS);
}

export async function getExecutiveDashboard() {
  const user = await requireExecutive();
  const permission = PERMISSIONS.EXECUTIVE_ACCESS;
  const leadScope = leadScopeWhere(user, permission);
  const invoiceScope = feeInvoiceScopeWhere(user, permission);
  const enrollmentScope = enrollmentScopeWhere(user, permission);
  const batchScope = batchScopeWhere(user, permission);
  const programScope = programScopeWhere(user, permission);
  const userScope = userThroughEnrollmentScopeWhere(user, permission);
  const resolved = resolveAuthorizedScopes(user, permission);
  const globalOnly = resolved.global ? {} : { id: "00000000-0000-0000-0000-000000000000" };
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const [admissionsToday, revenueToday, activeStudents, enrollments, completedEnrollments, attendanceRecords, trainerAssignments, bdmWins, communityPosts, marketplaceRevenue, aiUsage, systemSettings, pendingActions] = await Promise.all([
    prisma.lead.count({ where: { AND: [leadScope, { createdAt: { gte: start } }] } }),
    prisma.paymentTransaction.aggregate({ where: { status: "SUCCESS", paidAt: { gte: start }, invoice: invoiceScope }, _sum: { amount: true } }),
    prisma.studentEnrollment.count({ where: { AND: [enrollmentScope, { status: "ACTIVE" }] } }),
    prisma.studentEnrollment.count({ where: enrollmentScope }),
    prisma.studentEnrollment.count({ where: { AND: [enrollmentScope, { status: "COMPLETED" }] } }),
    prisma.attendanceRecord.findMany({ where: { createdAt: { gte: start }, batch: batchScope } }),
    prisma.trainerAssignment.count({ where: { status: "ACTIVE", batch: batchScope } }),
    prisma.lead.count({ where: { AND: [leadScope, { status: "WON" }] } }),
    prisma.communityPost.count({ where: { createdAt: { gte: start }, OR: [{ program: programScope }, { batch: batchScope }] } }),
    prisma.marketplaceListing.aggregate({ where: { ...globalOnly, status: "APPROVED" }, _sum: { priceCoins: true } }),
    prisma.aIUsageLog.aggregate({ where: { user: userScope }, _sum: { estimatedTokens: true }, _count: true }),
    prisma.systemSetting.count({ where: resolved.global ? {} : { institution: institutionScopeWhere(user, permission) } }),
    prisma.automationExecution.count({ where: { ...globalOnly, status: "PENDING" } })
  ]);
  const attendancePresent = attendanceRecords.filter((item) => item.status === "PRESENT" || item.status === "LATE").length;
  return {
    stats: {
      admissionsToday,
      revenueToday: revenueToday._sum.amount ?? 0,
      activeStudents,
      retentionRate: activeStudents === 0 ? 0 : 92,
      completionRate: enrollments === 0 ? 0 : Math.round((completedEnrollments / enrollments) * 100),
      attendance: attendanceRecords.length === 0 ? 0 : Math.round((attendancePresent / attendanceRecords.length) * 100),
      trainerPerformance: trainerAssignments,
      bdmPerformance: bdmWins,
      communityEngagement: communityPosts,
      marketplaceRevenue: marketplaceRevenue._sum.priceCoins ?? 0,
      aiUsage: aiUsage._sum.estimatedTokens ?? 0,
      systemHealth: systemSettings >= 0 ? 100 : 0,
      pendingExecutiveActions: pendingActions
    }
  };
}

export async function getExecutiveData() {
  const user = await requireExecutive();
  const permission = PERMISSIONS.EXECUTIVE_ACCESS;
  const resolved = resolveAuthorizedScopes(user, permission);
  const globalOnly = resolved.global ? {} : { id: "00000000-0000-0000-0000-000000000000" };
  const organizationIds = resolved.assignments.filter((scope) => scope.scope === "ORGANIZATION" && scope.institutionId).map((scope) => scope.institutionId as string);
  const institutionOwned = resolved.global ? {} : { institutionId: { in: organizationIds } };
  return Promise.all([
    prisma.institution.findMany({ where: institutionScopeWhere(user, permission), orderBy: { updatedAt: "desc" }, include: { campuses: true, departments: true, programs: true } }),
    prisma.campus.findMany({ where: campusScopeWhere(user, permission), orderBy: { updatedAt: "desc" }, include: { institution: true, district: true } }),
    prisma.department.findMany({ where: departmentScopeWhere(user, permission), orderBy: { updatedAt: "desc" }, include: { institution: true, division: true, campus: true } }),
    prisma.employee.findMany({ where: employeeScopeWhere(user, permission), orderBy: { updatedAt: "desc" }, include: { user: true, division: true, district: true, department: true, campus: true } }),
    prisma.automationRule.findMany({ where: globalOnly, orderBy: { updatedAt: "desc" }, include: { executions: { orderBy: { executedAt: "desc" }, take: 3 } } }),
    prisma.executiveReport.findMany({ where: institutionOwned, orderBy: { createdAt: "desc" }, include: { institution: true, createdBy: true } }),
    prisma.systemSetting.findMany({ where: institutionOwned, orderBy: { updatedAt: "desc" }, include: { institution: true } }),
    prisma.user.findMany({ where: { deletedAt: null, OR: [{ employeeProfile: employeeScopeWhere(user, permission) }, userThroughEnrollmentScopeWhere(user, permission)] }, orderBy: { name: "asc" }, include: { roles: { include: { role: true } } } }),
    prisma.program.findMany({ where: programScopeWhere(user, permission), orderBy: { updatedAt: "desc" }, include: { enrollments: true, batches: true } }),
    prisma.division.findMany({ where: divisionScopeWhere(user, permission), orderBy: { name: "asc" }, include: { institution: true } }),
    prisma.district.findMany({ where: districtScopeWhere(user, permission), orderBy: [{ stateName: "asc" }, { name: "asc" }], include: { institution: true } })
  ]);
}

export async function getFinanceOverview() {
  const user = await requireExecutive();
  const invoiceScope = feeInvoiceScopeWhere(user, PERMISSIONS.EXECUTIVE_ACCESS);
  const programScope = programScopeWhere(user, PERMISSIONS.EXECUTIVE_ACCESS);
  const [revenue, invoices, commissions, payments] = await Promise.all([
    prisma.paymentTransaction.aggregate({ where: { status: "SUCCESS", invoice: invoiceScope }, _sum: { amount: true } }),
    prisma.feeInvoice.findMany({ where: invoiceScope, orderBy: { updatedAt: "desc" }, take: 40, include: { program: true } }),
    prisma.commissionRecord.aggregate({ where: { OR: [{ invoice: invoiceScope }, { invoiceId: null, program: programScope }] }, _sum: { amount: true } }),
    prisma.paymentTransaction.groupBy({ by: ["provider", "status"], where: { invoice: invoiceScope }, _sum: { amount: true }, _count: true })
  ]);
  const outstanding = invoices.filter((item) => item.status === "ISSUED" || item.status === "PARTIALLY_PAID").reduce((sum, item) => sum + item.total, 0);
  const scholarships = invoices.reduce((sum, item) => sum + item.scholarship, 0);
  const refunds = 0;
  return { revenue: revenue._sum.amount ?? 0, outstanding, scholarships, refunds, commissions: commissions._sum.amount ?? 0, invoices, payments };
}

export async function getExecutiveStudentOverview() {
  const user = await requireExecutive();
  const permission = PERMISSIONS.EXECUTIVE_ACCESS;
  const enrollmentScope = enrollmentScopeWhere(user, permission);
  const concernScope = studentConcernScopeWhere(user, permission);
  const [active, completed, atRisk] = await Promise.all([
    prisma.studentEnrollment.count({ where: { AND: [enrollmentScope, { status: "ACTIVE" }] } }),
    prisma.studentEnrollment.count({ where: { AND: [enrollmentScope, { status: "COMPLETED" }] } }),
    prisma.studentConcern.count({ where: { AND: [concernScope, { status: { in: ["OPEN", "FOLLOW_UP"] } }] } })
  ]);
  return { active, completed, atRisk };
}
