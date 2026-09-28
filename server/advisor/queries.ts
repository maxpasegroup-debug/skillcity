import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { assertPermission } from "@/server/auth/authorization";
import { batchScopeWhere, employeeScopeWhere, userThroughEnrollmentScopeWhere } from "@/server/auth/scoping";
import { advisorStudentAccessWhere, effectiveAdvisorAssignmentWhere } from "@/server/advisor/access";

export async function getAdvisorAssignmentManagement() {
  const actor = await assertPermission(PERMISSIONS.ADVISOR_MANAGE);
  const batchScope = batchScopeWhere(actor, PERMISSIONS.ADVISOR_MANAGE);
  const studentScope = userThroughEnrollmentScopeWhere(actor, PERMISSIONS.ADVISOR_MANAGE);
  const employeeScope = employeeScopeWhere(actor, PERMISSIONS.ADVISOR_MANAGE);
  const activeEmployment: Prisma.EmployeeWhereInput = { status: { in: ["ACTIVE", "PROBATION", "ON_NOTICE"] } };

  return Promise.all([
    prisma.employee.findMany({
      where: {
        AND: [employeeScope, activeEmployment],
        user: {
          deletedAt: null,
          status: "ACTIVE",
          OR: [
            { roles: { some: { role: { key: "ACADEMIC_ADVISOR" } } } },
            { roles: { some: { role: { name: "Academic Advisor" } } } }
          ]
        }
      },
      orderBy: { user: { name: "asc" } },
      include: { user: true, designation: true }
    }),
    prisma.user.findMany({
      where: { AND: [studentScope, { deletedAt: null, roles: { some: { role: { name: "Student" } } } }] },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true }
    }),
    prisma.batch.findMany({
      where: batchScope,
      orderBy: [{ program: { name: "asc" } }, { name: "asc" }],
      include: { program: true }
    }),
    prisma.academicAdvisorAssignment.findMany({
      where: { OR: [{ batch: batchScope }, { student: studentScope }] },
      orderBy: { createdAt: "desc" },
      include: { advisor: { include: { user: true } }, student: true, batch: { include: { program: true } } }
    })
  ] as const);
}

export async function getAssignedAdvisorStudents() {
  const actor = await assertPermission(PERMISSIONS.ADVISOR_READ);
  if (!actor.employeeProfile?.id) return [];
  return prisma.user.findMany({
    where: {
      deletedAt: null,
      roles: { some: { role: { name: "Student" } } },
      ...advisorStudentAccessWhere(actor.employeeProfile.id)
    },
    orderBy: { name: "asc" },
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: { program: true, batch: true },
        orderBy: { startedAt: "desc" }
      },
      academicAdvisorAssignments: { where: effectiveAdvisorAssignmentWhere() }
    }
  });
}
