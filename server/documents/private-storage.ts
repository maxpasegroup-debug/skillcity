import { createHmac, timingSafeEqual } from "node:crypto";

export class PrivateDocumentStorageUnavailableError extends Error {
  constructor(message = "Private document delivery is not configured") {
    super(message);
    this.name = "PrivateDocumentStorageUnavailableError";
  }
}

type SignedGatewayPayload = { provider: string; storageKey: string; expiresAt: number };

function signingSecret() {
  const secret = process.env.PRIVATE_DOCUMENT_SIGNING_SECRET;
  if (!secret || secret.length < 32) throw new PrivateDocumentStorageUnavailableError();
  return secret;
}

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function isPrivateDocumentDeliveryConfigured(storageProvider?: string) {
  const configuredProvider = process.env.PRIVATE_DOCUMENT_PROVIDER;
  const gateway = process.env.PRIVATE_DOCUMENT_GATEWAY_URL;
  const secret = process.env.PRIVATE_DOCUMENT_SIGNING_SECRET;
  if (!configuredProvider || !gateway || !secret || secret.length < 32) return false;
  if (storageProvider && storageProvider !== configuredProvider) return false;
  try {
    const url = new URL(gateway);
    return process.env.NODE_ENV !== "production" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function createPrivateDocumentDownloadUrl(input: { storageProvider: string; storageKey: string; now?: Date }) {
  if (!isPrivateDocumentDeliveryConfigured(input.storageProvider)) throw new PrivateDocumentStorageUnavailableError();
  const gateway = new URL(process.env.PRIVATE_DOCUMENT_GATEWAY_URL!);
  const configuredTtl = Number(process.env.PRIVATE_DOCUMENT_URL_TTL_SECONDS ?? 60);
  if (!Number.isFinite(configuredTtl)) throw new PrivateDocumentStorageUnavailableError();
  const ttl = Math.min(300, Math.max(15, configuredTtl));
  const payload: SignedGatewayPayload = {
    provider: input.storageProvider,
    storageKey: input.storageKey,
    expiresAt: Math.floor((input.now?.getTime() ?? Date.now()) / 1000) + ttl
  };
  const token = Buffer.from(JSON.stringify(payload)).toString("base64url");
  gateway.searchParams.set("token", token);
  gateway.searchParams.set("signature", signature(token, signingSecret()));
  return gateway.toString();
}

export function verifyPrivateDocumentGatewayToken(input: { token: string; signature: string; secret: string; now?: Date }) {
  if (input.secret.length < 32 || !/^[a-f0-9]{64}$/i.test(input.signature)) return false;
  const expected = signature(input.token, input.secret);
  if (!timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(input.signature, "hex"))) return false;
  try {
    const payload = JSON.parse(Buffer.from(input.token, "base64url").toString("utf8")) as Partial<SignedGatewayPayload>;
    const nowSeconds = Math.floor((input.now?.getTime() ?? Date.now()) / 1000);
    return typeof payload.provider === "string" && payload.provider.length > 0 &&
      typeof payload.storageKey === "string" && payload.storageKey.length > 0 &&
      typeof payload.expiresAt === "number" && payload.expiresAt >= nowSeconds;
  } catch {
    return false;
  }
}
