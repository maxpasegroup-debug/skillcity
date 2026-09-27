import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS, type PermissionKey } from "@/lib/auth/permissions";
import { requirePermission } from "@/server/auth/authorization";
import { employeeScopeWhere, institutionScopeWhere, divisionScopeWhere, districtScopeWhere, campusScopeWhere, departmentScopeWhere } from "@/server/auth/scoping";

const employeeInclude = {
  user: { include: { roles: { include: { role: true } } } },
  designation: true,
  institution: true,
  division: true,
  district: true,
  campus: true,
  department: true,
  manager: { include: { user: true, designation: true } },
  organizationAssignments: {
    orderBy: [{ endsAt: "asc" as const }, { startsAt: "desc" as const }],
    include: { institution: true, division: true, district: true, campus: true, department: true, designationRecord: true }
  }
};

export async function getEmployeeDirectory(search?: string) {
  const actor = await requirePermission(PERMISSIONS.EMPLOYEE_READ);
  const term = search?.trim();
  const employees = await prisma.employee.findMany({
    where: {
      AND: [
        employeeScopeWhere(actor, PERMISSIONS.EMPLOYEE_READ),
        term ? {
          OR: [
            { employeeCode: { contains: term, mode: "insensitive" } },
            { user: { name: { contains: term, mode: "insensitive" } } },
            { user: { email: { contains: term, mode: "insensitive" } } },
            { designation: { name: { contains: term, mode: "insensitive" } } }
          ]
        } : {}
      ]
    },
    include: employeeInclude,
    orderBy: [{ status: "asc" }, { user: { name: "asc" } }],
    take: 200
  });
  return {
    employees,
    canCreate: hasPermission(actor, PERMISSIONS.EMPLOYEE_CREATE)
  };
}

export async function getEmployeeDetail(employeeId: string) {
  const actor = await requirePermission(PERMISSIONS.EMPLOYEE_READ);
  const employee = await prisma.employee.findFirst({
    where: { AND: [{ id: employeeId }, employeeScopeWhere(actor, PERMISSIONS.EMPLOYEE_READ)] },
    include: employeeInclude
  });
  if (!employee) return null;

  const [updateAccess, manageAccess] = await Promise.all([
    hasPermission(actor, PERMISSIONS.EMPLOYEE_UPDATE)
      ? prisma.employee.findFirst({ where: { AND: [{ id: employeeId }, employeeScopeWhere(actor, PERMISSIONS.EMPLOYEE_UPDATE)] }, select: { id: true } })
      : null,
    hasPermission(actor, PERMISSIONS.EMPLOYEE_MANAGE)
      ? prisma.employee.findFirst({ where: { AND: [{ id: employeeId }, employeeScopeWhere(actor, PERMISSIONS.EMPLOYEE_MANAGE)] }, select: { id: true } })
      : null
  ]);
  return { employee, canUpdate: Boolean(updateAccess), canManage: Boolean(manageAccess) };
}

export async function getEmployeeFormOptions(permission: PermissionKey) {
  const actor = await requirePermission(permission);
  const now = new Date();
  const [institutions, divisions, districts, campuses, departments, designations, managers] = await Promise.all([
    prisma.institution.findMany({ where: institutionScopeWhere(actor, permission), orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.division.findMany({ where: divisionScopeWhere(actor, permission), orderBy: { name: "asc" }, select: { id: true, name: true, institutionId: true } }),
    prisma.district.findMany({ where: districtScopeWhere(actor, permission), orderBy: [{ stateName: "asc" }, { name: "asc" }], select: { id: true, name: true, institutionId: true, stateName: true } }),
    prisma.campus.findMany({ where: campusScopeWhere(actor, permission), orderBy: { name: "asc" }, select: { id: true, name: true, institutionId: true, districtId: true } }),
    prisma.department.findMany({ where: departmentScopeWhere(actor, permission), orderBy: { name: "asc" }, select: { id: true, name: true, institutionId: true, divisionId: true, campusId: true } }),
    prisma.designation.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.employee.findMany({
      where: { AND: [employeeScopeWhere(actor, permission), { status: { notIn: ["INACTIVE", "EXITED"] } }] },
      orderBy: { user: { name: "asc" } },
      select: {
        id: true,
        employeeCode: true,
        institutionId: true,
        user: { select: { name: true } },
        organizationAssignments: {
          where: { startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
          select: { institutionId: true }
        }
      }
    })
  ]);
  return { institutions, divisions, districts, campuses, departments, designations, managers };
}

export async function getEmployeeForEdit(employeeId: string) {
  const actor = await requirePermission(PERMISSIONS.EMPLOYEE_UPDATE);
  return prisma.employee.findFirst({
    where: { AND: [{ id: employeeId }, employeeScopeWhere(actor, PERMISSIONS.EMPLOYEE_UPDATE)] },
    include: employeeInclude
  });
}
