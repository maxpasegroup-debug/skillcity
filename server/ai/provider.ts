import type { AIProvider } from "@prisma/client";
import type { z } from "zod";
import { getAIProviderConfig, type AIProviderConfig } from "@/server/ai/config";

export type AIProviderMessage = { role: "system" | "user" | "assistant"; content: string };
export type AIProviderRequest = { messages: AIProviderMessage[] };
export type AIProviderResult = {
  content: string;
  provider: AIProvider;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  responseTimeMs: number;
};

export class AIProviderError extends Error {
  constructor(public readonly code: "AI_PROVIDER_UNAVAILABLE" | "AI_PROVIDER_TIMEOUT" | "AI_PROVIDER_REJECTED" | "AI_PROVIDER_MALFORMED") {
    super(code);
    this.name = "AIProviderError";
  }
}

export interface AIGenerationProvider {
  readonly provider: AIProvider;
  readonly model: string;
  generate(input: AIProviderRequest): Promise<AIProviderResult>;
  stream(input: AIProviderRequest): AsyncIterable<string>;
  generateStructured<T>(input: AIProviderRequest, schema: z.ZodType<T>): Promise<AIProviderResult & { data: T }>;
}

export class OpenAIResponsesProvider implements AIGenerationProvider {
  readonly provider: AIProvider = "OPENAI";
  readonly model: string;

  constructor(private readonly config: AIProviderConfig, private readonly fetcher: typeof fetch = fetch) {
    this.model = config.model;
  }

  async generate(input: AIProviderRequest): Promise<AIProviderResult> {
    const started = Date.now();
    if (!this.config.apiKey) throw new AIProviderError("AI_PROVIDER_UNAVAILABLE");
    let response: Response;
    try {
      response = await this.fetcher(this.config.endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.config.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: this.model, input: input.messages }),
        signal: AbortSignal.timeout(this.config.timeoutMs)
      });
    } catch (error) {
      if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) throw new AIProviderError("AI_PROVIDER_TIMEOUT");
      throw new AIProviderError("AI_PROVIDER_UNAVAILABLE");
    }
    if (!response.ok) throw new AIProviderError("AI_PROVIDER_REJECTED");
    const data = await response.json() as { output_text?: string; usage?: { input_tokens?: number; output_tokens?: number } };
    if (!data.output_text) throw new AIProviderError("AI_PROVIDER_MALFORMED");
    return { content: data.output_text, provider: this.provider, model: this.model, inputTokens: data.usage?.input_tokens, outputTokens: data.usage?.output_tokens, responseTimeMs: Date.now() - started };
  }

  async *stream(input: AIProviderRequest) {
    const result = await this.generate(input);
    yield result.content;
  }

  async generateStructured<T>(input: AIProviderRequest, schema: z.ZodType<T>) {
    const result = await this.generate(input);
    let parsed: unknown;
    try { parsed = JSON.parse(result.content); } catch { throw new AIProviderError("AI_PROVIDER_MALFORMED"); }
    const validation = schema.safeParse(parsed);
    if (!validation.success) throw new AIProviderError("AI_PROVIDER_MALFORMED");
    return { ...result, data: validation.data };
  }
}

export function getAIProvider(config = getAIProviderConfig()): AIGenerationProvider | null {
  return config.apiKey && config.provider === "OPENAI" ? new OpenAIResponsesProvider(config) : null;
}
