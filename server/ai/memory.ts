import type { AIConversationScope, AIMessageRole, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { TaraContext } from "@/types/tara";

export async function getOrCreateConversation(input: {
  conversationId?: string;
  userId: string;
  scope: AIConversationScope;
  context: TaraContext;
  title?: string;
}) {
  if (input.conversationId) {
    const existing = await prisma.aIConversation.findFirst({
      where: { id: input.conversationId, userId: input.userId, archivedAt: null }
    });
    if (existing) return existing;
  }

  return prisma.aIConversation.create({
    data: {
      userId: input.userId,
      scope: input.scope,
      title: input.title ?? "Conversation with Tara",
      context: input.context
    }
  });
}

export function getConversationMessages(conversationId: string) {
  return prisma.aIMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 40
  });
}

export async function saveMessage(input: {
  conversationId: string;
  userId?: string;
  role: AIMessageRole;
  content: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.aIMessage.create({
    data: {
      conversationId: input.conversationId,
      userId: input.userId,
      role: input.role,
      content: input.content,
      metadata: input.metadata
    }
  });
}
