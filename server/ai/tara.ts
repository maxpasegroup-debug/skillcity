import type { AIMessage, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildSystemPrompt } from "@/server/ai/prompts";
import { getAIProvider, AIProviderError } from "@/server/ai/provider";
import type { TaraContext, TaraProviderResponse } from "@/types/tara";

export type TaraGenerateInput = { context: TaraContext; messages: AIMessage[]; userMessage: string; templateKey?: string };

export async function generateTaraResponse(input: TaraGenerateInput): Promise<TaraProviderResponse & { error?: string }> {
  const provider = getAIProvider();
  if (!provider) return { content: "Tara AI is available after an AI provider is configured by an administrator.", provider: "LOCAL", model: "configuration-required", responseTimeMs: 1, error: "AI_PROVIDER_UNAVAILABLE", errorCode: "AI_PROVIDER_UNAVAILABLE" };

  const started = Date.now();
  try {
    return await provider.generate({ messages: [
      { role: "system", content: buildSystemPrompt(input.context, input.templateKey) },
      ...input.messages.slice(-12).filter((message) => message.role === "USER" || message.role === "ASSISTANT").map((message) => ({ role: message.role === "ASSISTANT" ? "assistant" as const : "user" as const, content: message.content })),
      { role: "user", content: input.userMessage }
    ] });
  } catch (error) {
    const errorCode = error instanceof AIProviderError ? error.code : "AI_PROVIDER_UNAVAILABLE";
    return { content: "Tara could not complete that request. Please try again in a moment.", provider: provider.provider, model: provider.model, responseTimeMs: Date.now() - started, error: errorCode, errorCode };
  }
}

export async function logTaraUsage(input: { userId: string; conversationId: string; assistantId: string; requestId: string; response: TaraProviderResponse & { error?: string } }) {
  const measured = input.response.inputTokens !== undefined && input.response.outputTokens !== undefined;
  const operations: Prisma.PrismaPromise<unknown>[] = [prisma.aIUsageLog.create({ data: {
    userId: input.userId, conversationId: input.conversationId, assistantId: input.assistantId, requestId: input.requestId,
    provider: input.response.provider, model: input.response.model, responseTimeMs: input.response.responseTimeMs,
    estimatedTokens: measured ? input.response.inputTokens! + input.response.outputTokens! : 0,
    inputTokens: input.response.inputTokens, outputTokens: input.response.outputTokens,
    success: !input.response.error, errorCode: input.response.errorCode, error: input.response.errorCode
  } })];
  if (measured) operations.push(prisma.tokenUsage.create({ data: { userId: input.userId, conversationId: input.conversationId, provider: input.response.provider, model: input.response.model, inputTokens: input.response.inputTokens!, outputTokens: input.response.outputTokens!, totalTokens: input.response.inputTokens! + input.response.outputTokens! } }));
  await prisma.$transaction(operations);
}
