import { PrismaClient } from "@prisma/client";
import { assignmentCoversAcademicResource } from "../lib/academic/validation";

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const effective = { status: "ACTIVE" as const, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] };
  const [designated, roleUsers, activeAssignments, activeEnrollments] = await Promise.all([
    prisma.employee.findMany({
      where: { designation: { key: "ACADEMIC_ADVISOR" } },
      select: { id: true, userId: true, user: { select: { roles: { select: { role: { select: { key: true, name: true } } } } } } }
    }),
    prisma.user.findMany({
      where: { roles: { some: { role: { OR: [{ key: "ACADEMIC_ADVISOR" }, { name: "Academic Advisor" }] } } } },
      select: { id: true, employeeProfile: { select: { id: true, designation: { select: { key: true } } } } }
    }),
    prisma.academicAdvisorAssignment.findMany({
      where: effective,
      include: {
        advisor: { include: { user: true, organizationAssignments: { where: { startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] } } } },
        student: { include: { enrollments: { where: { status: "ACTIVE" }, include: { program: true, batch: true } } } },
        batch: { include: { program: true } }
      }
    }),
    prisma.studentEnrollment.findMany({
      where: { status: "ACTIVE" },
      include: {
        student: { include: { academicAdvisorAssignments: { where: effective } } },
        batch: { include: { academicAdvisorAssignments: { where: effective } } }
      }
    })
  ]);

  const directCounts = new Map<string, number>();
  let invalidTargetCount = 0;
  let organizationMismatchCount = 0;
  let inactiveAdvisorCount = 0;
  for (const assignment of activeAssignments) {
    if (Number(Boolean(assignment.studentId)) + Number(Boolean(assignment.batchId)) !== 1) invalidTargetCount += 1;
    if (assignment.studentId) directCounts.set(assignment.studentId, (directCounts.get(assignment.studentId) ?? 0) + 1);
    if (assignment.advisor.user.status !== "ACTIVE" || assignment.advisor.user.deletedAt) inactiveAdvisorCount += 1;
    const target = assignment.batch
      ? { institutionId: assignment.batch.program.institutionId, divisionId: assignment.batch.program.divisionId, campusId: assignment.batch.campusId ?? assignment.batch.program.campusId }
      : assignment.student?.enrollments[0]
        ? { institutionId: assignment.student.enrollments[0].program.institutionId, divisionId: assignment.student.enrollments[0].program.divisionId, campusId: assignment.student.enrollments[0].batch?.campusId ?? assignment.student.enrollments[0].program.campusId }
        : null;
    const advisorScopes = [assignment.advisor, ...assignment.advisor.organizationAssignments];
    if (!target || !advisorScopes.some((scope) => assignmentCoversAcademicResource(scope, target))) organizationMismatchCount += 1;
  }

  const output = {
    generatedAt: now.toISOString(),
    designatedAcademicAdvisors: designated.length,
    academicAdvisorRoleUsers: roleUsers.length,
    designatedWithoutRole: designated.filter((employee) => !employee.user.roles.some(({ role }) => role.key === "ACADEMIC_ADVISOR" || role.name === "Academic Advisor")).length,
    roleWithoutEmployee: roleUsers.filter((user) => !user.employeeProfile).length,
    roleWithoutDesignation: roleUsers.filter((user) => user.employeeProfile && user.employeeProfile.designation?.key !== "ACADEMIC_ADVISOR").length,
    effectiveAssignments: activeAssignments.length,
    effectiveDirectAssignments: activeAssignments.filter((assignment) => assignment.studentId).length,
    effectiveBatchAssignments: activeAssignments.filter((assignment) => assignment.batchId).length,
    studentsWithMultipleEffectiveDirectAssignments: [...directCounts.values()].filter((count) => count > 1).length,
    activeEnrollmentsWithoutEffectiveAdvisor: activeEnrollments.filter((enrollment) => enrollment.student.academicAdvisorAssignments.length === 0 && (enrollment.batch?.academicAdvisorAssignments.length ?? 0) === 0).length,
    invalidAssignmentTargets: invalidTargetCount,
    organizationMismatches: organizationMismatchCount,
    assignmentsWithInactiveAdvisorAccount: inactiveAdvisorCount
  };

  console.log(JSON.stringify(output, null, 2));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : "Academic advisor audit failed");
    await prisma.$disconnect();
    process.exit(1);
  });
