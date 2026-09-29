import { prisma } from "@/lib/prisma";
import { PERMISSIONS, resolveAuthorizedScopes } from "@/lib/auth/permissions";
import { requirePermission } from "@/server/auth/authorization";
import { campusScopeWhere, departmentScopeWhere, districtScopeWhere, divisionScopeWhere, employeeScopeWhere, enrollmentScopeWhere, institutionScopeWhere, programScopeWhere, studentConcernScopeWhere, userThroughEnrollmentScopeWhere } from "@/server/auth/scoping";
import { getExecutiveIntelligence } from "@/server/analytics/queries";

export async function requireExecutive() {
  return requirePermission(PERMISSIONS.EXECUTIVE_ACCESS);
}

export async function getExecutiveDashboard() {
  return getExecutiveIntelligence("TODAY");
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
