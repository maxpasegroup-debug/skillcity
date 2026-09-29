import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getCurrentUser: vi.fn(), hasPermission: vi.fn(), findFirst: vi.fn(), auditCreate: vi.fn(), createUrl: vi.fn(), scopeWhere: vi.fn() }));
vi.mock("@/server/auth/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/auth/permissions", () => ({ PERMISSIONS: { DOCUMENTS_READ: "documents.read" }, hasPermission: mocks.hasPermission }));
vi.mock("@/server/auth/scoping", () => ({ coreDocumentScopeWhere: mocks.scopeWhere }));
vi.mock("@/lib/prisma", () => ({ prisma: { coreDocument: { findFirst: mocks.findFirst }, platformAudit: { create: mocks.auditCreate } } }));
vi.mock("@/server/documents/private-storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/documents/private-storage")>();
  return { ...actual, createPrivateDocumentDownloadUrl: mocks.createUrl };
});

import { PrivateDocumentStorageUnavailableError } from "@/server/documents/private-storage";
import { GET } from "@/app/api/documents/[documentId]/versions/[versionId]/download/route";

const context = { params: Promise.resolve({ documentId: "document-1", versionId: "version-1" }) };
const actor = { id: "actor-1", roles: [], accessScopes: [] };

describe("private document download route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue(actor);
    mocks.hasPermission.mockReturnValue(true);
    mocks.scopeWhere.mockReturnValue({ institutionId: "org-1" });
    mocks.findFirst.mockResolvedValue({ id: "document-1", versions: [{ id: "version-1", storageProvider: "object-store", storageKey: "private/file.pdf" }] });
    mocks.createUrl.mockReturnValue("https://documents.example.test/download?token=signed");
    mocks.auditCreate.mockResolvedValue({ id: "audit-1" });
  });

  it("requires authentication", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    expect((await GET(new Request("http://localhost"), context)).status).toBe(401);
  });

  it("uses an indistinguishable not-found response for unauthorized and out-of-scope IDs", async () => {
    mocks.hasPermission.mockReturnValue(false);
    const unauthorized = await GET(new Request("http://localhost"), context);
    mocks.hasPermission.mockReturnValue(true);
    mocks.findFirst.mockResolvedValue(null);
    const missing = await GET(new Request("http://localhost"), context);
    expect(unauthorized.status).toBe(404);
    expect(await unauthorized.json()).toEqual(await missing.json());
  });

  it("requires an active private document in the actor scope for guessed or revoked IDs", async () => {
    mocks.findFirst.mockResolvedValue(null);
    const response = await GET(new Request("http://localhost"), context);
    expect(response.status).toBe(404);
    expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { AND: [expect.objectContaining({ id: "document-1", status: "ACTIVE", accessPolicy: "PRIVATE" }), { institutionId: "org-1" }] } }));
  });

  it("returns a short-lived redirect and audits authorized delivery", async () => {
    const response = await GET(new Request("http://localhost"), context);
    expect(response.status).toBe(307);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ actorId: "actor-1", entityId: "version-1" }) }));
  });

  it("fails closed when the provider is not configured", async () => {
    mocks.createUrl.mockImplementation(() => { throw new PrivateDocumentStorageUnavailableError(); });
    expect((await GET(new Request("http://localhost"), context)).status).toBe(503);
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });
});
