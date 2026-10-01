export type WhatsAppSendInput = {
  to: string;
  template: string;
  message: string;
};

export type WhatsAppSendResult = {
  status: "SENT" | "FAILED" | "QUEUED";
  provider: string;
  providerRef?: string;
  error?: string;
};

export interface WhatsAppProvider {
  send(input: WhatsAppSendInput): Promise<WhatsAppSendResult>;
}

class LogOnlyWhatsAppProvider implements WhatsAppProvider {
  async send(): Promise<WhatsAppSendResult> {
    return {
      status: "QUEUED",
      provider: "UNCONFIGURED",
      error: "No WhatsApp provider is configured"
    };
  }
}

class ApiWhatsAppProvider implements WhatsAppProvider {
  async send(input: WhatsAppSendInput): Promise<WhatsAppSendResult> {
    try {
      const digits = input.to.replace(/\D/g, "");
      const recipient = digits.length === 10 ? `91${digits}` : digits;
      const response = await fetch(env.WHATSAPP_API_URL!, {
        method: "POST",
        headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", to: recipient, type: "text", text: { body: input.message } })
      });
      const payload = await response.json().catch(() => ({})) as { messages?: Array<{ id?: string }>; error?: { message?: string } };
      if (!response.ok) return { status: "FAILED", provider: "WHATSAPP_API", error: payload.error?.message ?? `HTTP ${response.status}` };
      return { status: "SENT", provider: "WHATSAPP_API", providerRef: payload.messages?.[0]?.id };
    } catch (error) {
      return { status: "FAILED", provider: "WHATSAPP_API", error: error instanceof Error ? error.message : "WhatsApp request failed" };
    }
  }
}

export function getWhatsAppProvider(): WhatsAppProvider {
  if (env.WHATSAPP_API_URL && env.WHATSAPP_ACCESS_TOKEN) return new ApiWhatsAppProvider();
  return new LogOnlyWhatsAppProvider();
}
import { env } from "@/lib/env";
