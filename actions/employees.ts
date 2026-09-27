"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, type AuthorizationUser, type PermissionKey } from "@/lib/auth/permissions";
import { managerBelongsToOrganization, reportingLineCreatesCycle } from "@/lib/employees/reporting";
import { assertPermission, AuthorizationError } from "@/server/auth/authorization";
import { assertEmployeeAccess } from "@/server/auth/resource-access";
import { validateOrganizationPathForActor } from "@/server/organization/service";
import { createEmployeeSchema, deactivateEmployeeSchema, employeeAssignmentSchema, endEmployeeAssignmentSchema, normalizeEmployeeCode, updateEmployeeSchema } from "@/features/employees/schemas";

export type EmployeeActionState = { ok: boolean; message: string; employeeId?: string };

function failure(message: string): EmployeeActionState {
  return { ok: false, message };
}

function employeeError(error: unknown) {
  if (error instanceof AuthorizationError) throw error;
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return failure("Employee code or user relationship already exists.");
  throw error;
}

async function requireDesignation(designationId: string) {
  const designation = await prisma.designation.findFirst({ where: { id: designationId, active: true } });
  if (!designation) throw new AuthorizationError("Designation is unavailable");
  return designation;
}

async function employeeCodeIsAvailable(employeeCode: string, employeeId?: string) {
  const existing = await prisma.employee.findFirst({
    where: {
      employeeCode: { equals: employeeCode, mode: "insensitive" },
      ...(employeeId ? { id: { not: employeeId } } : {})
    },
    select: { id: true }
  });
  return !existing;
}

async function validateManager(actor: AuthorizationUser, permission: PermissionKey, employeeId: string | null, managerId: string | undefined, institutionId: string) {
  if (!managerId) return;
  if (employeeId && employeeId === managerId) throw new AuthorizationError("An employee cannot report to themselves");
  await assertEmployeeAccess(actor, permission, managerId);
  const now = new Date();
  const manager = await prisma.employee.findUnique({
    where: { id: managerId },
    select: {
      id: true,
      institutionId: true,
      organizationAssignments: {
        where: { startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        select: { institutionId: true }
      }
    }
  });
  if (!manager || !managerBelongsToOrganization(manager.institutionId, manager.organizationAssignments.map((assignment) => assignment.institutionId), institutionId)) {
    throw new AuthorizationError("Manager must belong to the employee organization");
  }

  if (employeeId) {
    const reportingLines = await prisma.employee.findMany({ select: { id: true, managerId: true } });
    if (reportingLineCreatesCycle(employeeId, managerId, reportingLines)) throw new AuthorizationError("Reporting manager would create a circular relationship");
  }
}

async function validateEmployeeInputs(actor: AuthorizationUser, permission: PermissionKey, data: {
  institutionId: string;
  divisionId?: string;
  districtId?: string;
  campusId?: string;
  departmentId?: string;
  designationId: string;
  managerId?: string;
}, employeeId: string | null) {
  await Promise.all([
    validateOrganizationPathForActor(actor, permission, data),
    requireDesignation(data.designationId)
  ]);
  await validateManager(actor, permission, employeeId, data.managerId, data.institutionId);
}

export async function createEmployeeAction(_: EmployeeActionState, formData: FormData): Promise<EmployeeActionState> {
  const actor = await assertPermission(PERMISSIONS.EMPLOYEE_CREATE);
  const parsed = createEmployeeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Check employee details.");
  const data = parsed.data;
  const employeeCode = normalizeEmployeeCode(data.employeeCode);
  await validateEmployeeInputs(actor, PERMISSIONS.EMPLOYEE_CREATE, data, null);
  if (!(await employeeCodeIsAvailable(employeeCode))) return failure("Employee code is already in use.");
  const [user, designation] = await Promise.all([
    prisma.user.findFirst({ where: { email: { equals: data.userEmail, mode: "insensitive" }, deletedAt: null }, select: { id: true, employeeProfile: { select: { id: true } } } }),
    requireDesignation(data.designationId)
  ]);
  if (!user) return failure("No active User identity exists for that email.");
  if (user.employeeProfile) return failure("That User identity is already linked to an Employee.");

  try {
    const employee = await prisma.$transaction(async (tx) => {
      const created = await tx.employee.create({
        data: {
          userId: user.id,
          employeeCode,
          designationId: data.designationId,
          title: designation.name,
          managerId: data.managerId,
          institutionId: data.institutionId,
          divisionId: data.divisionId,
          districtId: data.districtId,
          campusId: data.campusId,
          departmentId: data.departmentId,
          employmentType: data.employmentType,
          status: data.status,
          joinedAt: data.joinedAt,
          exitedAt: data.exitedAt
        }
      });
      await tx.platformAudit.create({ data: { actorId: actor.id, action: "EMPLOYEE_CREATED", entity: "Employee", entityId: created.id } });
      return created;
    });
    revalidatePath("/employees");
    return { ok: true, message: "Employee created.", employeeId: employee.id };
  } catch (error) {
    return employeeError(error);
  }
}

export async function updateEmployeeAction(_: EmployeeActionState, formData: FormData): Promise<EmployeeActionState> {
  const actor = await assertPermission(PERMISSIONS.EMPLOYEE_UPDATE);
  const parsed = updateEmployeeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Check employee details.");
  const data = parsed.data;
  const employeeCode = normalizeEmployeeCode(data.employeeCode);
  await assertEmployeeAccess(actor, PERMISSIONS.EMPLOYEE_UPDATE, data.employeeId);
  await validateEmployeeInputs(actor, PERMISSIONS.EMPLOYEE_UPDATE, data, data.employeeId);
  if (!(await employeeCodeIsAvailable(employeeCode, data.employeeId))) return failure("Employee code is already in use.");
  const designation = await requireDesignation(data.designationId);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id: data.employeeId },
        data: {
          employeeCode,
          designationId: data.designationId,
          title: designation.name,
          managerId: data.managerId ?? null,
          institutionId: data.institutionId,
          divisionId: data.divisionId ?? null,
          districtId: data.districtId ?? null,
          campusId: data.campusId ?? null,
          departmentId: data.departmentId ?? null,
          employmentType: data.employmentType,
          status: data.status,
          joinedAt: data.joinedAt ?? null,
          exitedAt: data.exitedAt ?? null
        }
      });
      await tx.platformAudit.create({ data: { actorId: actor.id, action: "EMPLOYEE_UPDATED", entity: "Employee", entityId: data.employeeId } });
    });
    revalidatePath("/employees");
    revalidatePath(`/employees/${data.employeeId}`);
    return { ok: true, message: "Employee updated.", employeeId: data.employeeId };
  } catch (error) {
    return employeeError(error);
  }
}

export async function addEmployeeAssignmentAction(_: EmployeeActionState, formData: FormData): Promise<EmployeeActionState> {
  const actor = await assertPermission(PERMISSIONS.EMPLOYEE_UPDATE);
  const parsed = employeeAssignmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Check assignment details.");
  const data = parsed.data;
  await assertEmployeeAccess(actor, PERMISSIONS.EMPLOYEE_UPDATE, data.employeeId);
  await validateOrganizationPathForActor(actor, PERMISSIONS.EMPLOYEE_UPDATE, data);
  const designation = data.designationId ? await requireDesignation(data.designationId) : null;
  const overlappingAssignment = await prisma.employeeOrganizationAssignment.findFirst({
    where: {
      employeeId: data.employeeId,
      institutionId: data.institutionId,
      divisionId: data.divisionId ?? null,
      districtId: data.districtId ?? null,
      campusId: data.campusId ?? null,
      departmentId: data.departmentId ?? null,
      startsAt: { lte: data.endsAt ?? new Date("9999-12-31") },
      OR: [{ endsAt: null }, { endsAt: { gt: data.startsAt } }]
    },
    select: { id: true }
  });
  if (overlappingAssignment) return failure("An overlapping assignment already exists for this organization placement.");
  await prisma.$transaction(async (tx) => {
    const created = await tx.employeeOrganizationAssignment.create({
      data: {
        employeeId: data.employeeId,
        institutionId: data.institutionId,
        divisionId: data.divisionId,
        districtId: data.districtId,
        campusId: data.campusId,
        departmentId: data.departmentId,
        designationId: data.designationId,
        designation: designation?.name,
        startsAt: data.startsAt,
        endsAt: data.endsAt
      }
    });
    await tx.platformAudit.create({ data: { actorId: actor.id, action: "EMPLOYEE_ASSIGNMENT_CREATED", entity: "EmployeeOrganizationAssignment", entityId: created.id } });
  });
  revalidatePath(`/employees/${data.employeeId}`);
  return { ok: true, message: "Organization assignment added.", employeeId: data.employeeId };
}

export async function endEmployeeAssignmentAction(_: EmployeeActionState, formData: FormData): Promise<EmployeeActionState> {
  const actor = await assertPermission(PERMISSIONS.EMPLOYEE_UPDATE);
  const parsed = endEmployeeAssignmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Invalid assignment.");
  await assertEmployeeAccess(actor, PERMISSIONS.EMPLOYEE_UPDATE, parsed.data.employeeId);
  const assignment = await prisma.employeeOrganizationAssignment.findFirst({ where: { id: parsed.data.assignmentId, employeeId: parsed.data.employeeId }, select: { id: true } });
  if (!assignment) throw new AuthorizationError("Assignment was not found");
  await prisma.$transaction([
    prisma.employeeOrganizationAssignment.update({ where: { id: assignment.id }, data: { endsAt: new Date() } }),
    prisma.platformAudit.create({ data: { actorId: actor.id, action: "EMPLOYEE_ASSIGNMENT_ENDED", entity: "EmployeeOrganizationAssignment", entityId: assignment.id } })
  ]);
  revalidatePath(`/employees/${parsed.data.employeeId}`);
  return { ok: true, message: "Assignment ended.", employeeId: parsed.data.employeeId };
}

export async function deactivateEmployeeAction(_: EmployeeActionState, formData: FormData): Promise<EmployeeActionState> {
  const actor = await assertPermission(PERMISSIONS.EMPLOYEE_MANAGE);
  const parsed = deactivateEmployeeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Choose a valid exit date.");
  await assertEmployeeAccess(actor, PERMISSIONS.EMPLOYEE_MANAGE, parsed.data.employeeId);
  const employee = await prisma.employee.findUnique({ where: { id: parsed.data.employeeId }, select: { joinedAt: true } });
  if (!employee) throw new AuthorizationError("Employee was not found");
  if (employee.joinedAt && parsed.data.exitedAt < employee.joinedAt) return failure("Exit date cannot be before joining date.");
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.employee.update({ where: { id: parsed.data.employeeId }, data: { status: "INACTIVE", exitedAt: parsed.data.exitedAt } });
    await tx.employeeOrganizationAssignment.updateMany({
      where: { employeeId: parsed.data.employeeId, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      data: { endsAt: now }
    });
    await tx.platformAudit.create({ data: { actorId: actor.id, action: "EMPLOYEE_DEACTIVATED", entity: "Employee", entityId: parsed.data.employeeId } });
  });
  revalidatePath("/employees");
  revalidatePath(`/employees/${parsed.data.employeeId}`);
  return { ok: true, message: "Employee deactivated. User account status was not changed.", employeeId: parsed.data.employeeId };
}
