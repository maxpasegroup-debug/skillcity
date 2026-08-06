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
  async send(input: WhatsAppSendInput): Promise<WhatsAppSendResult> {
    console.info("[whatsapp:log-only]", {
      to: input.to,
      template: input.template,
      message: input.message
    });

    return {
      status: "SENT",
      provider: "LOG_ONLY",
      providerRef: `local-${Date.now()}`
    };
  }
}

export function getWhatsAppProvider(): WhatsAppProvider {
  return new LogOnlyWhatsAppProvider();
}
