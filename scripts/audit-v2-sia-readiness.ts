import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const departmentHeadKeys = [
  "PEOPLE_OPERATIONS_HEAD",
  "ADMISSIONS_GROWTH_HEAD",
  "ACADEMIC_HEAD",
  "FINANCE_COMPLIANCE_HEAD",
  "TECHNOLOGY_PRODUCTS_HEAD",
  "CAREER_PARTNERSHIPS_HEAD"
];

async function main() {
  const [assistant, roles, pendingProposals] = await Promise.all([
    prisma.aIAssistant.findUnique({ where: { code: "tara" }, select: { id: true, code: true, name: true, status: true, allowedTools: true } }),
    prisma.role.findMany({
      where: { key: { in: departmentHeadKeys }, deletedAt: null },
      select: { key: true, name: true, permissions: { where: { permission: { key: "ai.approve", active: true } }, select: { scope: true } } }
    }),
    prisma.aIActionProposal.findMany({ where: { status: "PENDING_APPROVAL" }, select: { id: true, toolCode: true, organizationContext: true, createdAt: true }, orderBy: { createdAt: "asc" } })
  ]);

  const roleCoverage = departmentHeadKeys.map((key) => {
    const role = roles.find((item) => item.key === key);
    return { key, present: Boolean(role), organizationApproval: role?.permissions.some((grant) => grant.scope === "ORGANIZATION") ?? false };
  });
  const proposalsWithoutOrganization = pendingProposals.filter((proposal) => {
    const context = proposal.organizationContext;
    return !context || typeof context !== "object" || Array.isArray(context) || !("institutionId" in context) || typeof context.institutionId !== "string";
  });

  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    readOnly: true,
    assistant,
    roleCoverage,
    pendingProposalCount: pendingProposals.length,
    manualReviewRequired: {
      missingDepartmentHeadApproval: roleCoverage.filter((item) => !item.organizationApproval),
      pendingProposalsWithoutOrganization: proposalsWithoutOrganization.map((item) => ({ id: item.id, toolCode: item.toolCode, createdAt: item.createdAt }))
    }
  }, null, 2));
}

main().then(() => prisma.$disconnect()).catch(async (error) => {
  console.error(error instanceof Error ? error.message : "V2 SIA readiness audit failed");
  await prisma.$disconnect();
  process.exit(1);
});
