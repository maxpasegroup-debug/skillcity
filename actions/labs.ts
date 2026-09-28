"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission, type AuthorizationUser, type PermissionKey } from "@/lib/auth/permissions";
import { assignmentCoversLabsProduct, normalizeLabsProductCode } from "@/lib/labs/product";
import { createLabsProductSchema, endLabsAssignmentSchema, labsContributorSchema, replaceLabsOwnerSchema, updateLabsProductSchema } from "@/features/labs/schemas";
import { assertPermission, AuthorizationError } from "@/server/auth/authorization";
import { assertEmployeeAccess, assertLabsProductAccess } from "@/server/auth/resource-access";
import { employeeScopeWhere } from "@/server/auth/scoping";
import { validateOrganizationPathForActor } from "@/server/organization/service";

export type LabsActionState = { ok: boolean; message: string; code?: string };

type ProductScope = { institutionId: string; divisionId: string; districtId?: string | null; campusId?: string | null; departmentId?: string | null };

function failure(message: string): LabsActionState {
  return { ok: false, message };
}

function optional(value?: string) {
  return value || null;
}

async function getEligibleEmployee(actor: AuthorizationUser, permission: PermissionKey, employeeId: string, product: ProductScope) {
  await assertEmployeeAccess(actor, permission, employeeId);
  const now = new Date();
  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      AND: [employeeScopeWhere(actor, permission), { status: { in: ["ACTIVE", "PROBATION", "ON_NOTICE"] } }],
      user: { status: "ACTIVE", deletedAt: null }
    },
    include: {
      user: true,
      organizationAssignments: { where: { startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] } }
    }
  });
  if (!employee) throw new AuthorizationError("Product member must be an active Employee in the authorized scope");
  if (![employee, ...employee.organizationAssignments].some((assignment) => assignmentCoversLabsProduct(assignment, product))) {
    throw new AuthorizationError("Employee organization assignment does not cover this Labs product");
  }
  return employee;
}

async function productForMutation(actor: AuthorizationUser, permission: PermissionKey, productId: string) {
  await assertLabsProductAccess(actor, permission, productId);
  const product = await prisma.labsProduct.findUnique({ where: { id: productId } });
  if (!product) throw new AuthorizationError("Labs product not found");
  return product;
}

export async function createLabsProductAction(_: LabsActionState, formData: FormData): Promise<LabsActionState> {
  const actor = await assertPermission(PERMISSIONS.LABS_CREATE);
  const parsed = createLabsProductSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Check product details.");
  const data = parsed.data;
  await validateOrganizationPathForActor(actor, PERMISSIONS.LABS_CREATE, data);
  const scope: ProductScope = { institutionId: data.institutionId, divisionId: data.divisionId, districtId: optional(data.districtId), campusId: optional(data.campusId), departmentId: optional(data.departmentId) };
  const owner = await getEligibleEmployee(actor, PERMISSIONS.LABS_CREATE, data.ownerId, scope);
  const code = normalizeLabsProductCode(data.code);

  try {
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.labsProduct.create({
        data: {
          ...scope,
          code,
          name: data.name,
          description: data.description,
          type: data.type,
          lifecycle: data.lifecycle,
          archivedAt: data.lifecycle === "ARCHIVED" ? new Date() : null,
          createdById: actor.id
        }
      });
      const assignment = await tx.labsProductAssignment.create({ data: { productId: created.id, employeeId: owner.id, role: "OWNER", responsibility: "Primary Product Owner", createdById: actor.id } });
      await tx.platformAudit.create({ data: { actorId: actor.id, action: "LABS_PRODUCT_CREATED", entity: "LabsProduct", entityId: created.id, metadata: { code, ownerAssignmentId: assignment.id } } });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    revalidatePath("/labs");
    return { ok: true, message: "Labs product created.", code: product.code };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return failure("Product code is already in use.");
    throw error;
  }
}

export async function updateLabsProductAction(_: LabsActionState, formData: FormData): Promise<LabsActionState> {
  const actor = await assertPermission(PERMISSIONS.LABS_UPDATE);
  const parsed = updateLabsProductSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Check product details.");
  const data = parsed.data;
  const current = await productForMutation(actor, PERMISSIONS.LABS_UPDATE, data.productId);
  if ((current.lifecycle === "ARCHIVED" || data.lifecycle === "ARCHIVED") && current.lifecycle !== data.lifecycle && !hasPermission(actor, PERMISSIONS.LABS_MANAGE)) {
    throw new AuthorizationError("Archiving or restoring a Labs product requires labs.manage");
  }
  await validateOrganizationPathForActor(actor, PERMISSIONS.LABS_UPDATE, data);
  const code = normalizeLabsProductCode(data.code);
  if (code !== current.code) return failure("Product code is stable and cannot be changed after creation.");
  if (
    data.institutionId !== current.institutionId ||
    data.divisionId !== current.divisionId ||
    optional(data.districtId) !== current.districtId ||
    optional(data.campusId) !== current.campusId ||
    optional(data.departmentId) !== current.departmentId
  ) return failure("Product organization scope cannot be moved through the product editor.");
  try {
    await prisma.$transaction([
      prisma.labsProduct.update({
        where: { id: current.id },
        data: {
          institutionId: data.institutionId,
          divisionId: data.divisionId,
          districtId: optional(data.districtId),
          campusId: optional(data.campusId),
          departmentId: optional(data.departmentId),
          code,
          name: data.name,
          description: data.description,
          type: data.type,
          lifecycle: data.lifecycle,
          archivedAt: data.lifecycle === "ARCHIVED" ? current.archivedAt ?? new Date() : null
        }
      }),
      prisma.platformAudit.create({ data: { actorId: actor.id, action: current.lifecycle === data.lifecycle ? "LABS_PRODUCT_UPDATED" : "LABS_PRODUCT_STATUS_CHANGED", entity: "LabsProduct", entityId: current.id, metadata: { from: current.lifecycle, to: data.lifecycle } } })
    ]);
    revalidatePath("/labs");
    revalidatePath(`/labs/${code}`);
    return { ok: true, message: "Labs product updated.", code };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return failure("Product code is already in use.");
    throw error;
  }
}

export async function replaceLabsOwnerAction(_: LabsActionState, formData: FormData): Promise<LabsActionState> {
  const actor = await assertPermission(PERMISSIONS.LABS_ASSIGN);
  const parsed = replaceLabsOwnerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Choose a valid product owner.");
  const product = await productForMutation(actor, PERMISSIONS.LABS_ASSIGN, parsed.data.productId);
  const employee = await getEligibleEmployee(actor, PERMISSIONS.LABS_ASSIGN, parsed.data.employeeId, product);
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const existing = await tx.labsProductAssignment.findMany({ where: { productId: product.id, role: "OWNER", status: "ACTIVE" } });
    for (const assignment of existing) {
      await tx.labsProductAssignment.update({
        where: { id: assignment.id },
        data: { status: "INACTIVE", endsAt: assignment.startsAt < now ? now : null }
      });
    }
    const created = await tx.labsProductAssignment.create({ data: { productId: product.id, employeeId: employee.id, role: "OWNER", responsibility: "Primary Product Owner", startsAt: now, createdById: actor.id } });
    await tx.platformAudit.create({ data: { actorId: actor.id, action: "LABS_PRODUCT_OWNER_REPLACED", entity: "LabsProduct", entityId: product.id, metadata: { employeeId: employee.id, assignmentId: created.id } } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  revalidatePath(`/labs/${product.code}`);
  revalidatePath("/labs");
  return { ok: true, message: "Product owner replaced." };
}

export async function addLabsContributorAction(_: LabsActionState, formData: FormData): Promise<LabsActionState> {
  const actor = await assertPermission(PERMISSIONS.LABS_ASSIGN);
  const parsed = labsContributorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Check contributor details.");
  const data = parsed.data;
  const product = await productForMutation(actor, PERMISSIONS.LABS_ASSIGN, data.productId);
  const employee = await getEligibleEmployee(actor, PERMISSIONS.LABS_ASSIGN, data.employeeId, product);
  const startsAt = new Date(data.startsAt);
  const endsAt = data.endsAt ? new Date(data.endsAt) : null;
  const overlapping = await prisma.labsProductAssignment.findFirst({
    where: { productId: product.id, employeeId: employee.id, role: "CONTRIBUTOR", status: "ACTIVE", startsAt: { lt: endsAt ?? new Date("9999-12-31") }, OR: [{ endsAt: null }, { endsAt: { gt: startsAt } }] },
    select: { id: true }
  });
  if (overlapping) return failure("This employee already has an overlapping contributor assignment.");
  await prisma.$transaction(async (tx) => {
    const created = await tx.labsProductAssignment.create({ data: { productId: product.id, employeeId: employee.id, role: "CONTRIBUTOR", responsibility: data.responsibility, startsAt, endsAt, createdById: actor.id } });
    await tx.platformAudit.create({ data: { actorId: actor.id, action: "LABS_PRODUCT_CONTRIBUTOR_ASSIGNED", entity: "LabsProductAssignment", entityId: created.id, metadata: { productId: product.id, employeeId: employee.id } } });
  });
  revalidatePath(`/labs/${product.code}`);
  return { ok: true, message: "Product contributor assigned." };
}

export async function endLabsAssignmentAction(_: LabsActionState, formData: FormData): Promise<LabsActionState> {
  const actor = await assertPermission(PERMISSIONS.LABS_ASSIGN);
  const parsed = endLabsAssignmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Invalid product assignment.");
  const product = await productForMutation(actor, PERMISSIONS.LABS_ASSIGN, parsed.data.productId);
  const assignment = await prisma.labsProductAssignment.findFirst({ where: { id: parsed.data.assignmentId, productId: product.id } });
  if (!assignment) throw new AuthorizationError("Product assignment not found");
  if (assignment.role === "OWNER") return failure("Replace the product owner instead of ending primary ownership.");
  const now = new Date();
  await prisma.$transaction([
    prisma.labsProductAssignment.update({ where: { id: assignment.id }, data: { status: "INACTIVE", endsAt: assignment.startsAt < now ? now : null } }),
    prisma.platformAudit.create({ data: { actorId: actor.id, action: "LABS_PRODUCT_ASSIGNMENT_ENDED", entity: "LabsProductAssignment", entityId: assignment.id, metadata: { productId: product.id } } })
  ]);
  revalidatePath(`/labs/${product.code}`);
  return { ok: true, message: "Product assignment ended." };
}
