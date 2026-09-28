import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [templates, messages, events, executions, notifications, legacyCommunicationLogs, legacyWhatsAppLogs, legacySensitiveWhatsAppLogs, providers, rules] = await Promise.all([
    prisma.communicationTemplate.groupBy({ by: ["channel", "status"], _count: true }),
    prisma.communicationMessage.groupBy({ by: ["channel", "status"], _count: true }),
    prisma.domainEvent.groupBy({ by: ["type", "status"], _count: true }),
    prisma.automationExecution.groupBy({ by: ["status"], _count: true }),
    prisma.notification.groupBy({ by: ["status"], _count: true }),
    prisma.communicationLog.count(),
    prisma.whatsAppMessageLog.groupBy({ by: ["status", "provider"], _count: true }),
    prisma.whatsAppMessageLog.count({ where: { OR: [{ message: { contains: "Temporary PIN:" } }, { message: { contains: "OTP" } }] } }),
    prisma.notificationProvider.findMany({ select: { name: true, status: true } }),
    prisma.automationRule.groupBy({ by: ["triggerType", "actionType", "active"], _count: true })
  ]);

  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    central: { templates, messages, events, executions, notifications, rules },
    legacyPreserved: { communicationLogs: legacyCommunicationLogs, whatsAppLogs: legacyWhatsAppLogs },
    manualReviewRequired: { legacyWhatsAppLogsContainingCredentialMarkers: legacySensitiveWhatsAppLogs },
    providerMetadataOnly: providers
  }, null, 2));
}

main().then(() => prisma.$disconnect()).catch(async (error) => {
  console.error(error instanceof Error ? error.message : "Communications audit failed");
  await prisma.$disconnect();
  process.exit(1);
});
