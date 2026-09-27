import { prisma } from "@/lib/prisma";
import { PERMISSIONS, type AuthorizationUser, type PermissionKey } from "@/lib/auth/permissions";
import { validateOrganizationPath, type OrganizationPath } from "@/lib/organization/hierarchy";
import { assertPermission, AuthorizationError } from "@/server/auth/authorization";
import { assertCampusAccess, assertDepartmentAccess, assertDistrictAccess, assertDivisionAccess, assertEmployeeAccess, assertInstitutionAccess } from "@/server/auth/resource-access";
import { campusScopeWhere, departmentScopeWhere, districtScopeWhere, divisionScopeWhere, institutionScopeWhere } from "@/server/auth/scoping";

async function organizationActor() {
  return assertPermission(PERMISSIONS.ORGANIZATION_MANAGE);
}

export async function getOrganization(organizationId: string) {
  const actor = await organizationActor();
  return prisma.institution.findFirst({
    where: { AND: [{ id: organizationId }, institutionScopeWhere(actor, PERMISSIONS.ORGANIZATION_MANAGE)] },
    include: { divisions: true, districts: true, campuses: true, departments: true }
  });
}

export async function getDivisions() {
  const actor = await organizationActor();
  return prisma.division.findMany({ where: divisionScopeWhere(actor, PERMISSIONS.ORGANIZATION_MANAGE), orderBy: { name: "asc" } });
}

export async function getDistricts() {
  const actor = await organizationActor();
  return prisma.district.findMany({ where: districtScopeWhere(actor, PERMISSIONS.ORGANIZATION_MANAGE), orderBy: [{ stateName: "asc" }, { name: "asc" }] });
}

export async function getCampuses() {
  const actor = await organizationActor();
  return prisma.campus.findMany({ where: campusScopeWhere(actor, PERMISSIONS.ORGANIZATION_MANAGE), orderBy: { name: "asc" }, include: { district: true } });
}

export async function getDepartments() {
  const actor = await organizationActor();
  return prisma.department.findMany({ where: departmentScopeWhere(actor, PERMISSIONS.ORGANIZATION_MANAGE), orderBy: { name: "asc" }, include: { division: true, campus: true } });
}

export async function getEmployeeOrganizationAssignments(employeeId: string) {
  const actor = await organizationActor();
  await assertEmployeeAccess(actor, PERMISSIONS.ORGANIZATION_MANAGE, employeeId);
  return prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      user: true,
      institution: true,
      division: true,
      district: true,
      campus: true,
      department: true,
      manager: { include: { user: true } },
      organizationAssignments: {
        orderBy: [{ endsAt: "asc" }, { startsAt: "desc" }],
        include: { institution: true, division: true, district: true, campus: true, department: true }
      }
    }
  });
}

export async function validateEmployeeOrganizationAssignment(employeeId: string, path: OrganizationPath) {
  const actor = await organizationActor();
  await assertEmployeeAccess(actor, PERMISSIONS.ORGANIZATION_MANAGE, employeeId);
  return validateOrganizationPathForActor(actor, PERMISSIONS.ORGANIZATION_MANAGE, path);
}

export async function validateOrganizationPathForActor(actor: AuthorizationUser, permission: PermissionKey, path: OrganizationPath) {
  await assertInstitutionAccess(actor, permission, path.institutionId);
  if (path.divisionId) await assertDivisionAccess(actor, permission, path.divisionId);
  if (path.districtId) await assertDistrictAccess(actor, permission, path.districtId);
  if (path.campusId) await assertCampusAccess(actor, permission, path.campusId);
  if (path.departmentId) await assertDepartmentAccess(actor, permission, path.departmentId);
  const [institution, division, district, campus, department] = await Promise.all([
    prisma.institution.findUnique({ where: { id: path.institutionId }, select: { id: true } }),
    path.divisionId ? prisma.division.findUnique({ where: { id: path.divisionId }, select: { id: true, institutionId: true } }) : null,
    path.districtId ? prisma.district.findUnique({ where: { id: path.districtId }, select: { id: true, institutionId: true } }) : null,
    path.campusId ? prisma.campus.findUnique({ where: { id: path.campusId }, select: { id: true, institutionId: true, districtId: true } }) : null,
    path.departmentId ? prisma.department.findUnique({ where: { id: path.departmentId }, select: { id: true, institutionId: true, divisionId: true, campusId: true } }) : null
  ]);
  if (!institution || (path.divisionId && !division) || (path.districtId && !district) || (path.campusId && !campus) || (path.departmentId && !department)) {
    throw new AuthorizationError("One or more organization units do not exist");
  }
  const result = validateOrganizationPath(path, { division, district, campus, department });
  if (!result.valid) throw new AuthorizationError(result.issues.join(" "));
  return path;
}
