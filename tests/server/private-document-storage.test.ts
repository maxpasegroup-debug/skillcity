import { afterEach, describe, expect, it } from "vitest";
import { createPrivateDocumentDownloadUrl, verifyPrivateDocumentGatewayToken } from "@/server/documents/private-storage";

const originalEnv = { ...process.env };

describe("private document signed gateway", () => {
  afterEach(() => { process.env = { ...originalEnv }; });

  it("creates a short-lived token that verifies for the configured provider", () => {
    process.env.PRIVATE_DOCUMENT_PROVIDER = "object-store";
    process.env.PRIVATE_DOCUMENT_GATEWAY_URL = "https://documents.example.test/download";
    process.env.PRIVATE_DOCUMENT_SIGNING_SECRET = "a-secure-test-secret-with-32-characters";
    process.env.PRIVATE_DOCUMENT_URL_TTL_SECONDS = "60";
    const now = new Date("2026-09-29T10:00:00.000Z");
    const url = new URL(createPrivateDocumentDownloadUrl({ storageProvider: "object-store", storageKey: "private/file.pdf", now }));
    expect(verifyPrivateDocumentGatewayToken({ token: url.searchParams.get("token")!, signature: url.searchParams.get("signature")!, secret: process.env.PRIVATE_DOCUMENT_SIGNING_SECRET, now })).toBe(true);
  });

  it("rejects expired and tampered tokens", () => {
    process.env.PRIVATE_DOCUMENT_PROVIDER = "object-store";
    process.env.PRIVATE_DOCUMENT_GATEWAY_URL = "https://documents.example.test/download";
    process.env.PRIVATE_DOCUMENT_SIGNING_SECRET = "a-secure-test-secret-with-32-characters";
    const issued = new Date("2026-09-29T10:00:00.000Z");
    const url = new URL(createPrivateDocumentDownloadUrl({ storageProvider: "object-store", storageKey: "private/file.pdf", now: issued }));
    const token = url.searchParams.get("token")!;
    const signature = url.searchParams.get("signature")!;
    expect(verifyPrivateDocumentGatewayToken({ token, signature, secret: process.env.PRIVATE_DOCUMENT_SIGNING_SECRET, now: new Date("2026-09-29T10:10:00.000Z") })).toBe(false);
    expect(verifyPrivateDocumentGatewayToken({ token: `${token}x`, signature, secret: process.env.PRIVATE_DOCUMENT_SIGNING_SECRET, now: issued })).toBe(false);
  });
});
