import type { AIConversationScope } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function getTaraConversations(userId: string, scope: AIConversationScope) {
  return prisma.aIConversation.findMany({
    where: { userId, scope, archivedAt: null },
    orderBy: { updatedAt: "desc" },
    take: 20,
    include: { messages: { orderBy: { createdAt: "asc" }, take: 40 } }
  });
}
