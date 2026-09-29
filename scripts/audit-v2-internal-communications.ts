import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const channels = await prisma.internalChannel.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      members: {
        include: {
          user: { select: { id: true, status: true, deletedAt: true, employeeProfile: { select: { id: true } } } }
        }
      },
      _count: { select: { messages: true } }
    }
  });

  const findings = channels.map((channel) => ({
    channelId: channel.id,
    name: channel.name,
    type: channel.type,
    archived: Boolean(channel.archivedAt),
    activeMembers: channel.members.filter((member) => member.status === "ACTIVE").length,
    messages: channel._count.messages,
    ownerCount: channel.members.filter((member) => member.status === "ACTIVE" && member.role === "OWNER").length,
    membersWithoutEmployee: channel.members.filter((member) => member.status === "ACTIVE" && !member.user.employeeProfile).map((member) => member.userId),
    unavailableMembers: channel.members.filter((member) => member.status === "ACTIVE" && (member.user.status !== "ACTIVE" || member.user.deletedAt)).map((member) => member.userId)
  }));

  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    readOnly: true,
    totals: {
      channels: channels.length,
      activeChannels: channels.filter((channel) => !channel.archivedAt).length,
      memberships: channels.reduce((sum, channel) => sum + channel.members.length, 0),
      messages: channels.reduce((sum, channel) => sum + channel._count.messages, 0)
    },
    manualReviewRequired: findings.filter((finding) => finding.ownerCount !== 1 || finding.membersWithoutEmployee.length > 0 || finding.unavailableMembers.length > 0)
  }, null, 2));
}

main().then(() => prisma.$disconnect()).catch(async (error) => {
  console.error(error instanceof Error ? error.message : "V2 internal communications audit failed");
  await prisma.$disconnect();
  process.exit(1);
});
