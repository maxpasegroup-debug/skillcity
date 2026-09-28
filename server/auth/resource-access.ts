import { prisma } from "@/lib/prisma";
import type { AuthorizationUser, PermissionKey } from "@/lib/auth/permissions";
import { AuthorizationError } from "@/server/auth/authorization";
import { activityScopeWhere, applicationScopeWhere, batchScopeWhere, campusScopeWhere, careerApplicationScopeWhere, departmentScopeWhere, districtScopeWhere, divisionScopeWhere, documentScopeWhere, employeeScopeWhere, enrollmentScopeWhere, feeInvoiceScopeWhere, institutionScopeWhere, labsProductScopeWhere, leadScopeWhere, programScopeWhere } from "@/server/auth/scoping";

async function requireRecord(record: { id: string } | null, label: string) {
  if (!record) throw new AuthorizationError(`${label} was not found in the authorized organization scope`);
  return record;
}

export async function assertLeadAccess(user: AuthorizationUser, permission: PermissionKey, id: string) {
  return requireRecord(await prisma.lead.findFirst({ where: { AND: [{ id }, leadScopeWhere(user, permission)] }, select: { id: true } }), "Lead");
}

export async function assertApplicationAccess(user: AuthorizationUser, permission: PermissionKey, id: string) {
  return requireRecord(await prisma.admissionApplication.findFirst({ where: { AND: [{ id }, applicationScopeWhere(user, permission)] }, select: { id: true } }), "Application");
}

export async function assertProgramAccess(user: AuthorizationUser, permission: PermissionKey, id: string) {
  return requireRecord(await prisma.program.findFirst({ where: { AND: [{ id }, programScopeWhere(user, permission)] }, select: { id: true } }), "Program");
}

export async function assertBatchAccess(user: AuthorizationUser, permission: PermissionKey, id: string) {
  return requireRecord(await prisma.batch.findFirst({ where: { AND: [{ id }, batchScopeWhere(user, permission)] }, select: { id: true } }), "Batch");
}

export async function assertLabsProductAccess(user: AuthorizationUser, permission: PermissionKey, id: string) {
  return requireRecord(await prisma.labsProduct.findFirst({ where: { AND: [{ id }, labsProductScopeWhere(user, permission)] }, select: { id: true } }), "Labs product");
}

export async function assertEnrollmentAccess(user: AuthorizationUser, permission: PermissionKey, id: string) {
  return requireRecord(await prisma.studentEnrollment.findFirst({ where: { AND: [{ id }, enrollmentScopeWhere(user, permission)] }, select: { id: true } }), "Enrollment");
}

export async function assertStudentAccess(user: AuthorizationUser, permission: PermissionKey, id: string) {
  const enrollment = enrollmentScopeWhere(user, permission);
  return requireRecord(await prisma.user.findFirst({ where: { id, enrollments: { some: enrollment } }, select: { id: true } }), "Student");
}

export async function assertDocumentAccess(user: AuthorizationUser, permission: PermissionKey, id: string) {
  return requireRecord(await prisma.studentDocument.findFirst({ where: { AND: [{ id }, documentScopeWhere(user, permission)] }, select: { id: true } }), "Document");
}

export async function assertInvoiceAccess(user: AuthorizationUser, permission: PermissionKey, id: string) {
  return requireRecord(await prisma.feeInvoice.findFirst({ where: { AND: [{ id }, feeInvoiceScopeWhere(user, permission)] }, select: { id: true } }), "Invoice");
}

export async function assertCareerApplicationAccess(user: AuthorizationUser, permission: PermissionKey, id: string) {
  return requireRecord(await prisma.careerApplication.findFirst({ where: { AND: [{ id }, careerApplicationScopeWhere(user, permission)] }, select: { id: true } }), "Career application");
}

export async function assertCareerInterviewAccess(user: AuthorizationUser, permission: PermissionKey, id: string) {
  const application = careerApplicationScopeWhere(user, permission);
  return requireRecord(await prisma.careerInterview.findFirst({ where: { id, application }, select: { id: true } }), "Career interview");
}

export async function assertRMDevelopmentAccess(user: AuthorizationUser, permission: PermissionKey, id: string) {
  const application = careerApplicationScopeWhere(user, permission);
  return requireRecord(await prisma.relationshipManagerDevelopment.findFirst({ where: { id, application }, select: { id: true } }), "RM development record");
}

export async function assertEmployeeAccess(user: AuthorizationUser, permission: PermissionKey, id: string) {
  return requireRecord(await prisma.employee.findFirst({ where: { AND: [{ id }, employeeScopeWhere(user, permission)] }, select: { id: true } }), "Employee");
}

export async function assertActivityAccess(user: AuthorizationUser, permission: PermissionKey, id: string) {
  return requireRecord(await prisma.activity.findFirst({ where: { AND: [{ id }, activityScopeWhere(user, permission)] }, select: { id: true } }), "Activity");
}

export async function assertBlueprintAccess(user: AuthorizationUser, permission: PermissionKey, id: string) {
  return requireRecord(await prisma.blueprint.findFirst({ where: { id, program: programScopeWhere(user, permission) }, select: { id: true } }), "Blueprint");
}

export async function assertJourneyAccess(user: AuthorizationUser, permission: PermissionKey, id: string) {
  return requireRecord(await prisma.journey.findFirst({ where: { id, program: programScopeWhere(user, permission) }, select: { id: true } }), "Journey");
}

export async function assertJourneyDayAccess(user: AuthorizationUser, permission: PermissionKey, id: string) {
  const program = programScopeWhere(user, permission);
  return requireRecord(await prisma.journeyDay.findFirst({ where: { id, week: { phase: { journey: { program } } } }, select: { id: true } }), "Journey day");
}

export async function assertInstitutionAccess(user: AuthorizationUser, permission: PermissionKey, id: string) {
  return requireRecord(await prisma.institution.findFirst({ where: { AND: [{ id }, institutionScopeWhere(user, permission)] }, select: { id: true } }), "Organization");
}

export async function assertDistrictAccess(user: AuthorizationUser, permission: PermissionKey, id: string) {
  return requireRecord(await prisma.district.findFirst({ where: { AND: [{ id }, districtScopeWhere(user, permission)] }, select: { id: true } }), "District");
}

export async function assertDivisionAccess(user: AuthorizationUser, permission: PermissionKey, id: string) {
  return requireRecord(await prisma.division.findFirst({ where: { AND: [{ id }, divisionScopeWhere(user, permission)] }, select: { id: true } }), "Division");
}

export async function assertCampusAccess(user: AuthorizationUser, permission: PermissionKey, id: string) {
  return requireRecord(await prisma.campus.findFirst({ where: { AND: [{ id }, campusScopeWhere(user, permission)] }, select: { id: true } }), "Branch or centre");
}

export async function assertDepartmentAccess(user: AuthorizationUser, permission: PermissionKey, id: string) {
  return requireRecord(await prisma.department.findFirst({ where: { AND: [{ id }, departmentScopeWhere(user, permission)] }, select: { id: true } }), "Department");
}
