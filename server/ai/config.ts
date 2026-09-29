import type { AIProvider } from "@prisma/client";

export type AIProviderConfig = {
  provider: AIProvider;
  model: string;
  endpoint: string;
  apiKey?: string;
  timeoutMs: number;
};

export function getAIProviderConfig(env: Readonly<Record<string, string | undefined>> = process.env): AIProviderConfig {
  const timeout = Number(env.AI_PROVIDER_TIMEOUT_MS ?? "30000");
  return {
    provider: env.OPENAI_API_KEY ? "OPENAI" : "LOCAL",
    model: env.OPENAI_MODEL || "gpt-4.1-mini",
    endpoint: env.OPENAI_RESPONSES_URL || "https://api.openai.com/v1/responses",
    apiKey: env.OPENAI_API_KEY,
    timeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : 30000
  };
}

export function publicAIProviderConfig(config = getAIProviderConfig()) {
  return { provider: config.provider, model: config.model, configured: Boolean(config.apiKey), timeoutMs: config.timeoutMs };
}
