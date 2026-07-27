import type { AIMessage, AIProvider } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildSystemPrompt } from "@/server/ai/prompts";
import type { TaraContext, TaraProviderResponse } from "@/types/tara";

export type TaraGenerateInput = {
  context: TaraContext;
  messages: AIMessage[];
  userMessage: string;
  templateKey?: string;
};

type TaraProvider = {
  provider: AIProvider;
  model: string;
  generate(input: TaraGenerateInput): Promise<TaraProviderResponse>;
};

function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
}

class OpenAIResponsesProvider implements TaraProvider {
  provider: AIProvider = "OPENAI";
  model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  async generate(input: TaraGenerateInput): Promise<TaraProviderResponse> {
    const started = Date.now();
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        input: [
          { role: "system", content: buildSystemPrompt(input.context, input.templateKey) },
          ...input.messages.slice(-12).map((message) => ({
            role: message.role === "ASSISTANT" ? "assistant" : "user",
            content: message.content
          })),
          { role: "user", content: input.userMessage }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    const data = (await response.json()) as {
      output_text?: string;
      usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number };
    };
    const content = data.output_text ?? "Tara could not generate a response.";
    return {
      content,
      provider: this.provider,
      model: this.model,
      inputTokens: data.usage?.input_tokens ?? estimateTokens(JSON.stringify(input.context) + input.userMessage),
      outputTokens: data.usage?.output_tokens ?? estimateTokens(content),
      responseTimeMs: Date.now() - started
    };
  }
}

class ConfigurationProvider implements TaraProvider {
  provider: AIProvider = "LOCAL";
  model = "configuration-required";

  async generate(input: TaraGenerateInput): Promise<TaraProviderResponse> {
    const content = [
      "Tara AI is ready, but the production AI provider is not configured yet.",
      "",
      "Set `OPENAI_API_KEY` on the server to enable contextual Tara responses.",
      "",
      `Context loaded for ${input.context.user.name}: ${input.context.program ?? "no active program"}, ${input.context.currentDay ?? "no current day"}.`
    ].join("\n");
    return {
      content,
      provider: this.provider,
      model: this.model,
      inputTokens: estimateTokens(input.userMessage),
      outputTokens: estimateTokens(content),
      responseTimeMs: 1
    };
  }
}

export function getTaraProvider(): TaraProvider {
  return process.env.OPENAI_API_KEY ? new OpenAIResponsesProvider() : new ConfigurationProvider();
}

export async function generateTaraResponse(input: TaraGenerateInput) {
  const provider = getTaraProvider();
  const started = Date.now();
  try {
    return await provider.generate(input);
  } catch (error) {
    return {
      content: "Tara could not complete that request. Please try again in a moment.",
      provider: provider.provider,
      model: provider.model,
      inputTokens: estimateTokens(input.userMessage),
      outputTokens: 16,
      responseTimeMs: Date.now() - started,
      error: error instanceof Error ? error.message : "Unknown AI error"
    };
  }
}

export async function logTaraUsage(input: {
  userId: string;
  conversationId: string;
  response: TaraProviderResponse & { error?: string };
}) {
  await prisma.$transaction([
    prisma.aIUsageLog.create({
      data: {
        userId: input.userId,
        conversationId: input.conversationId,
        provider: input.response.provider,
        model: input.response.model,
        responseTimeMs: input.response.responseTimeMs,
        estimatedTokens: input.response.inputTokens + input.response.outputTokens,
        success: !input.response.error,
        error: input.response.error
      }
    }),
    prisma.tokenUsage.create({
      data: {
        userId: input.userId,
        conversationId: input.conversationId,
        provider: input.response.provider,
        model: input.response.model,
        inputTokens: input.response.inputTokens,
        outputTokens: input.response.outputTokens,
        totalTokens: input.response.inputTokens + input.response.outputTokens
      }
    })
  ]);
}
