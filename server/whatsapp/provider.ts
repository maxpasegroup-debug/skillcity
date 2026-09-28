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

export function getWhatsAppProvider(): WhatsAppProvider {
  return new LogOnlyWhatsAppProvider();
}
