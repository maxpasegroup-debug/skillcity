import { createHmac, timingSafeEqual } from "node:crypto";

export const DOMAIN_EVENT_TYPES = ["lead.created", "career.application.submitted", "payment.confirmed"] as const;
export const COMMUNICATION_CHANNELS = ["EMAIL", "WHATSAPP", "INTERNAL_NOTIFICATION"] as const;
export const COMMUNICATION_PURPOSES = ["TRANSACTIONAL", "OPERATIONAL", "MARKETING"] as const;
export const AUTOMATION_RECIPIENT_KEYS = ["recipientUserId"] as const;

export type DomainEventType = (typeof DOMAIN_EVENT_TYPES)[number];

export function normalizeCommunicationCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
}

export function templateVariables(value: string) {
  return [...new Set(Array.from(value.matchAll(/{{\s*([A-Za-z][A-Za-z0-9_]*)\s*}}/g), (match) => match[1]))];
}

export function renderCommunicationTemplate(value: string, variables: Record<string, string>) {
  const required = templateVariables(value);
  const missing = required.filter((key) => variables[key] === undefined);
  if (missing.length > 0) throw new Error(`Missing template variables: ${missing.join(", ")}`);
  return value.replace(/{{\s*([A-Za-z][A-Za-z0-9_]*)\s*}}/g, (_, key: string) => variables[key]);
}

export function maskRecipient(value?: string | null) {
  if (!value) return null;
  const at = value.indexOf("@");
  if (at > 1) return `${value.slice(0, 2)}***${value.slice(at)}`;
  const visible = value.replace(/\D/g, "").slice(-4);
  return visible ? `***${visible}` : "***";
}

export function retryDelay(attempt: number) {
  return Math.min(60, Math.max(1, 2 ** Math.max(0, attempt - 1))) * 60_000;
}

export function verifyWebhookSignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature || !secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const received = signature.replace(/^sha256=/, "");
  if (expected.length !== received.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

const deliveryRanks = { QUEUED: 0, PROCESSING: 1, SUBMITTED: 2, SENT: 3, DELIVERED: 4, READ: 5, FAILED: 6, CANCELLED: 7 } as const;

export function canApplyDeliveryStatus(current: keyof typeof deliveryRanks, next: keyof typeof deliveryRanks) {
  if (current === next) return true;
  if (current === "FAILED" || current === "CANCELLED") return false;
  if (next === "FAILED" || next === "CANCELLED") return true;
  return deliveryRanks[next] > deliveryRanks[current];
}
