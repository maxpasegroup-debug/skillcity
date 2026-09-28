import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/server/auth/authorization";
import { campusScopeWhere, departmentScopeWhere, districtScopeWhere, divisionScopeWhere, employeeScopeWhere, institutionScopeWhere, labsProductScopeWhere } from "@/server/auth/scoping";

export function effectiveLabsAssignmentWhere(now = new Date()) {
  return { status: "ACTIVE" as const, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] };
}

export async function getLabsCatalogData() {
  const actor = await requirePermission(PERMISSIONS.LABS_READ, "/admin-login");
  const now = new Date();
  const products = await prisma.labsProduct.findMany({
    where: labsProductScopeWhere(actor, PERMISSIONS.LABS_READ),
    orderBy: [{ lifecycle: "asc" }, { name: "asc" }],
    include: {
      division: true,
      assignments: {
        where: { ...effectiveLabsAssignmentWhere(now), role: "OWNER" },
        include: { employee: { include: { user: true } } },
        orderBy: { startsAt: "desc" },
        take: 1
      }
    }
  });
  return { actor, products, canCreate: hasPermission(actor, PERMISSIONS.LABS_CREATE) };
}

export async function getLabsCreateOptions() {
  const actor = await requirePermission(PERMISSIONS.LABS_CREATE, "/admin-login");
  return Promise.all([
    prisma.institution.findMany({ where: institutionScopeWhere(actor, PERMISSIONS.LABS_CREATE), orderBy: { name: "asc" } }),
    prisma.division.findMany({ where: divisionScopeWhere(actor, PERMISSIONS.LABS_CREATE), orderBy: { name: "asc" } }),
    prisma.district.findMany({ where: districtScopeWhere(actor, PERMISSIONS.LABS_CREATE), orderBy: { name: "asc" } }),
    prisma.campus.findMany({ where: campusScopeWhere(actor, PERMISSIONS.LABS_CREATE), orderBy: { name: "asc" } }),
    prisma.department.findMany({ where: departmentScopeWhere(actor, PERMISSIONS.LABS_CREATE), orderBy: { name: "asc" } }),
    prisma.employee.findMany({
      where: { AND: [employeeScopeWhere(actor, PERMISSIONS.LABS_CREATE), { status: { in: ["ACTIVE", "PROBATION", "ON_NOTICE"] }, user: { status: "ACTIVE", deletedAt: null } }] },
      orderBy: { user: { name: "asc" } },
      include: { user: true }
    })
  ] as const);
}

export async function getLabsProductDetail(code: string) {
  const actor = await requirePermission(PERMISSIONS.LABS_READ, "/admin-login");
  const product = await prisma.labsProduct.findFirst({
    where: { AND: [{ code }, labsProductScopeWhere(actor, PERMISSIONS.LABS_READ)] },
    include: {
      institution: true,
      division: true,
      district: true,
      campus: true,
      department: true,
      assignments: {
        orderBy: [{ status: "asc" }, { startsAt: "desc" }],
        include: { employee: { include: { user: true, designation: true } }, createdBy: true }
      }
    }
  });
  return {
    actor,
    product,
    canUpdate: hasPermission(actor, PERMISSIONS.LABS_UPDATE),
    canAssign: hasPermission(actor, PERMISSIONS.LABS_ASSIGN)
  };
}

export async function getLabsProductEmployees(productId: string) {
  const actor = await requirePermission(PERMISSIONS.LABS_ASSIGN, "/admin-login");
  const product = await prisma.labsProduct.findFirst({
    where: { AND: [{ id: productId }, labsProductScopeWhere(actor, PERMISSIONS.LABS_ASSIGN)] },
    select: { institutionId: true, divisionId: true, districtId: true, campusId: true, departmentId: true }
  });
  if (!product) return [];
  return prisma.employee.findMany({
    where: { AND: [employeeScopeWhere(actor, PERMISSIONS.LABS_ASSIGN), { status: { in: ["ACTIVE", "PROBATION", "ON_NOTICE"] }, user: { status: "ACTIVE", deletedAt: null } }] },
    orderBy: { user: { name: "asc" } },
    include: { user: true, organizationAssignments: true }
  });
}
