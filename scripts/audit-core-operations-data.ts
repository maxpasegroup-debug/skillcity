import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [coreDocuments, coreDocumentVersions, studentDocuments, complianceRecords, invoices, invoicesWithoutDirectScope, payments, paymentsWithoutRecorder, wallets, walletTransactions, commissions, storageProviders] = await Promise.all([
    prisma.coreDocument.count(),
    prisma.coreDocumentVersion.count(),
    prisma.studentDocument.count(),
    prisma.complianceRecord.groupBy({ by: ["status"], _count: true }),
    prisma.feeInvoice.groupBy({ by: ["status", "currency"], _count: true, _sum: { total: true } }),
    prisma.feeInvoice.count({ where: { institutionId: null } }),
    prisma.paymentTransaction.groupBy({ by: ["provider", "status"], _count: true, _sum: { amount: true } }),
    prisma.paymentTransaction.count({ where: { recordedById: null } }),
    prisma.wallet.count(),
    prisma.walletTransaction.count(),
    prisma.commissionRecord.groupBy({ by: ["status"], _count: true, _sum: { amount: true } }),
    prisma.storageProvider.findMany({ select: { name: true, status: true } })
  ]);

  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    coreDocuments: { documents: coreDocuments, versions: coreDocumentVersions },
    legacyDocumentsNotMigrated: { studentDocuments },
    compliance: complianceRecords,
    finance: { invoices, invoicesWithoutDirectScope, payments, paymentsWithoutRecorder },
    separateDomainsNotMigrated: { wallets, walletTransactions, commissions },
    storageProviders
  }, null, 2));
}

main().then(() => prisma.$disconnect()).catch(async (error) => {
  console.error(error instanceof Error ? error.message : "Core operations audit failed");
  await prisma.$disconnect();
  process.exit(1);
});
