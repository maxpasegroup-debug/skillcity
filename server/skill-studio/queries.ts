import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/server/auth/authorization";
import { campusScopeWhere, departmentScopeWhere, divisionScopeWhere, employeeScopeWhere, institutionScopeWhere, skillStudioBatchScopeWhere, skillStudioProgramScopeWhere } from "@/server/auth/scoping";

export async function getSkillStudioCatalog() {
  const actor = await requirePermission(PERMISSIONS.SKILL_STUDIO_READ, "/admin-login");
  const programs = await prisma.program.findMany({
    where: skillStudioProgramScopeWhere(actor, PERMISSIONS.SKILL_STUDIO_READ),
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: { division: true, campus: true, _count: { select: { batches: true, enrollments: true } } }
  });
  return { actor, programs, canCreate: hasPermission(actor, PERMISSIONS.SKILL_STUDIO_CREATE) };
}

export async function getSkillStudioCreateOptions() {
  const actor = await requirePermission(PERMISSIONS.SKILL_STUDIO_CREATE, "/admin-login");
  return Promise.all([
    prisma.institution.findMany({ where: institutionScopeWhere(actor, PERMISSIONS.SKILL_STUDIO_CREATE), orderBy: { name: "asc" } }),
    prisma.division.findMany({ where: divisionScopeWhere(actor, PERMISSIONS.SKILL_STUDIO_CREATE), orderBy: { name: "asc" } }),
    prisma.campus.findMany({ where: campusScopeWhere(actor, PERMISSIONS.SKILL_STUDIO_CREATE), orderBy: { name: "asc" } }),
    prisma.department.findMany({ where: departmentScopeWhere(actor, PERMISSIONS.SKILL_STUDIO_CREATE), orderBy: { name: "asc" } })
  ] as const);
}

export async function getSkillStudioUpdateOptions() {
  const actor = await requirePermission(PERMISSIONS.SKILL_STUDIO_UPDATE, "/admin-login");
  return Promise.all([
    prisma.institution.findMany({ where: institutionScopeWhere(actor, PERMISSIONS.SKILL_STUDIO_UPDATE), orderBy: { name: "asc" } }),
    prisma.division.findMany({ where: divisionScopeWhere(actor, PERMISSIONS.SKILL_STUDIO_UPDATE), orderBy: { name: "asc" } }),
    prisma.campus.findMany({ where: campusScopeWhere(actor, PERMISSIONS.SKILL_STUDIO_UPDATE), orderBy: { name: "asc" } }),
    prisma.department.findMany({ where: departmentScopeWhere(actor, PERMISSIONS.SKILL_STUDIO_UPDATE), orderBy: { name: "asc" } })
  ] as const);
}

export async function getSkillStudioProgram(slug: string) {
  const actor = await requirePermission(PERMISSIONS.SKILL_STUDIO_READ, "/admin-login");
  const program = await prisma.program.findFirst({
    where: { AND: [{ slug }, skillStudioProgramScopeWhere(actor, PERMISSIONS.SKILL_STUDIO_READ)] },
    include: {
      institution: true,
      division: true,
      campus: true,
      department: true,
      journeys: { orderBy: { version: "desc" } },
      batches: {
        where: skillStudioBatchScopeWhere(actor, PERMISSIONS.SKILL_STUDIO_READ),
        orderBy: { startsAt: "desc" },
        include: {
          campus: true,
          trainerAssignments: { where: { status: "ACTIVE" }, include: { trainer: true } },
          _count: { select: { enrollments: true } }
        }
      }
    }
  });
  return {
    actor,
    program,
    canCreate: hasPermission(actor, PERMISSIONS.SKILL_STUDIO_CREATE),
    canUpdate: hasPermission(actor, PERMISSIONS.SKILL_STUDIO_UPDATE),
    canManage: hasPermission(actor, PERMISSIONS.SKILL_STUDIO_MANAGE),
    canAssign: hasPermission(actor, PERMISSIONS.SKILL_STUDIO_ASSIGN)
  };
}

export async function getSkillStudioTrainerOptions() {
  const actor = await requirePermission(PERMISSIONS.SKILL_STUDIO_ASSIGN, "/admin-login");
  return prisma.employee.findMany({
    where: {
      AND: [employeeScopeWhere(actor, PERMISSIONS.SKILL_STUDIO_ASSIGN), { status: { in: ["ACTIVE", "PROBATION", "ON_NOTICE"] } }],
      user: { status: "ACTIVE", deletedAt: null, roles: { some: { role: { name: "Trainer" } } } }
    },
    orderBy: { user: { name: "asc" } },
    include: { user: true }
  });
}

export async function getMySkillStudioLearning() {
  const actor = await requirePermission(PERMISSIONS.SKILL_STUDIO_READ);
  return prisma.studentEnrollment.findMany({
    where: { studentId: actor.id, program: { operatingDomain: "SKILL_STUDIO", deletedAt: null } },
    orderBy: { startedAt: "desc" },
    include: { program: true, journey: true, batch: { include: { campus: true, trainerAssignments: { where: { status: "ACTIVE" }, include: { trainer: true } } } } }
  });
}
