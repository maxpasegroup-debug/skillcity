import { PrismaClient } from "@prisma/client";
import { assignmentCoversLabsProduct, isEffectiveLabsAssignment } from "../lib/labs/product";

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const [products, labsPrograms, portfolioProjects, marketplaceProjects] = await Promise.all([
    prisma.labsProduct.findMany({
      include: {
        assignments: { include: { employee: { include: { user: true, organizationAssignments: true } } } }
      }
    }),
    prisma.program.count({ where: { OR: [{ slug: "aira-labs" }, { name: { contains: "AIRA Labs", mode: "insensitive" } }] } }),
    prisma.portfolioProject.count(),
    prisma.marketplaceListing.count({ where: { type: "PROJECT" } })
  ]);

  let productsWithoutEffectiveOwner = 0;
  let productsWithMultipleEffectiveOwners = 0;
  let incompatibleEffectiveAssignments = 0;
  let inactiveEmployeeAssignments = 0;
  for (const product of products) {
    const effective = product.assignments.filter((assignment) => isEffectiveLabsAssignment(assignment, now));
    const owners = effective.filter((assignment) => assignment.role === "OWNER");
    if (owners.length === 0) productsWithoutEffectiveOwner += 1;
    if (owners.length > 1) productsWithMultipleEffectiveOwners += 1;
    for (const assignment of effective) {
      if (![assignment.employee, ...assignment.employee.organizationAssignments].some((scope) => assignmentCoversLabsProduct(scope, product))) incompatibleEffectiveAssignments += 1;
      if (!["ACTIVE", "PROBATION", "ON_NOTICE"].includes(assignment.employee.status) || assignment.employee.user.status !== "ACTIVE" || assignment.employee.user.deletedAt) inactiveEmployeeAssignments += 1;
    }
  }

  console.log(JSON.stringify({
    generatedAt: now.toISOString(),
    labsProducts: products.length,
    productsWithoutEffectiveOwner,
    productsWithMultipleEffectiveOwners,
    incompatibleEffectiveAssignments,
    inactiveEmployeeAssignments,
    adjacentRecordsNotAutomaticallyMigrated: { labsPrograms, portfolioProjects, marketplaceProjects }
  }, null, 2));
}

main().then(() => prisma.$disconnect()).catch(async (error) => {
  console.error(error instanceof Error ? error.message : "Labs audit failed");
  await prisma.$disconnect();
  process.exit(1);
});
