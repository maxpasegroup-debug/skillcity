import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const groups = await prisma.paymentTransaction.groupBy({
    by: ["provider", "providerRef"],
    where: { providerRef: { not: null } },
    _count: { _all: true }
  });
  const duplicates = groups.filter((group) => group._count._all > 1);
  const byProvider = Object.fromEntries(
    Array.from(new Set(duplicates.map((group) => group.provider))).map((provider) => [
      provider,
      {
        duplicateGroups: duplicates.filter((group) => group.provider === provider).length,
        affectedRows: duplicates.filter((group) => group.provider === provider).reduce((total, group) => total + group._count._all, 0)
      }
    ])
  );

  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    readOnly: true,
    paymentReferenceGroups: groups.length,
    duplicateGroups: duplicates.length,
    affectedRows: duplicates.reduce((total, group) => total + group._count._all, 0),
    byProvider,
    referencesRedacted: true
  }, null, 2));
}

main().then(() => prisma.$disconnect()).catch(async (error) => {
  console.error(error instanceof Error ? error.message : "Payment reference audit failed");
  await prisma.$disconnect();
  process.exit(1);
});
