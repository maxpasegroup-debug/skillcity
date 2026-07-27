import { prisma } from "@/lib/prisma";

export function getUnreadNotifications(userId: string) {
  return prisma.notification.findMany({
    where: {
      userId,
      status: "UNREAD"
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 10
  });
}
