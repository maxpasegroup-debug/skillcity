import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), cookieGet: vi.fn() }));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: mocks.cookieGet, set: vi.fn(), delete: vi.fn() }),
  headers: async () => ({ get: vi.fn() })
}));

vi.mock("@/lib/prisma", () => ({ prisma: { session: { findUnique: mocks.findUnique } } }));

import { getCurrentUser } from "@/server/auth/session";

const activeUser = { id: "user-1", status: "ACTIVE", deletedAt: null, roles: [], accessScopes: [], employeeProfile: null };

describe("session lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookieGet.mockReturnValue({ value: "session-token" });
  });

  it("returns the active user for a live session", async () => {
    mocks.findUnique.mockResolvedValue({ user: activeUser, revokedAt: null, expiresAt: new Date(Date.now() + 60_000) });
    await expect(getCurrentUser()).resolves.toEqual(activeUser);
  });

  it.each([
    ["revoked", { revokedAt: new Date(), expiresAt: new Date(Date.now() + 60_000), user: activeUser }],
    ["expired", { revokedAt: null, expiresAt: new Date(Date.now() - 60_000), user: activeUser }],
    ["suspended", { revokedAt: null, expiresAt: new Date(Date.now() + 60_000), user: { ...activeUser, status: "SUSPENDED" } }]
  ])("rejects a %s session", async (_label, session) => {
    mocks.findUnique.mockResolvedValue(session);
    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("does not query the database without a session cookie", async () => {
    mocks.cookieGet.mockReturnValue(undefined);
    await expect(getCurrentUser()).resolves.toBeNull();
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });
});
