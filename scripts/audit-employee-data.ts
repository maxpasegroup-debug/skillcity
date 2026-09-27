import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      userId: true,
      employeeCode: true,
      title: true,
      employmentType: true,
      status: true,
      joinedAt: true,
      exitedAt: true,
      institutionId: true
    }
  });
  const codeCounts = new Map<string, number>();
  for (const employee of employees) {
    if (employee.employeeCode) codeCounts.set(employee.employeeCode.toUpperCase(), (codeCounts.get(employee.employeeCode.toUpperCase()) ?? 0) + 1);
  }
  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  for (const employee of employees) {
    byStatus[employee.status] = (byStatus[employee.status] ?? 0) + 1;
    byType[employee.employmentType] = (byType[employee.employmentType] ?? 0) + 1;
  }
  const trainerUsersWithoutEmployee = await prisma.user.count({
    where: { deletedAt: null, roles: { some: { role: { name: "Trainer" } } }, employeeProfile: null }
  });
  const selectedCandidatesWithoutEmployee = await prisma.careerApplication.count({
    where: { stage: "SELECTED", employeeId: null }
  });

  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    employees: {
      total: employees.length,
      missingEmployeeCode: employees.filter((employee) => !employee.employeeCode).length,
      duplicateEmployeeCodesIgnoringCase: [...codeCounts.entries()].filter(([, count]) => count > 1).map(([code, count]) => ({ code, count })),
      missingLegacyTitle: employees.filter((employee) => !employee.title).length,
      missingPrimaryOrganization: employees.filter((employee) => !employee.institutionId).length,
      missingJoiningDate: employees.filter((employee) => !employee.joinedAt).length,
      exitedWithoutExitDate: employees.filter((employee) => employee.status === "EXITED" && !employee.exitedAt).length,
      byStatus,
      byType
    },
    relationships: { trainerUsersWithoutEmployee, selectedCandidatesWithoutEmployee }
  }, null, 2));
}

main()
  .finally(async () => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
