import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  auditCreate: vi.fn(),
  verifyPassword: vi.fn(),
  createSession: vi.fn()
}));

vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: mocks.findUnique }, auditLog: { create: mocks.auditCreate } }
}));
vi.mock("@/lib/security/rate-limit", () => ({ checkRateLimit: () => ({ allowed: true }) }));
vi.mock("@/lib/security/password", () => ({ hashPassword: vi.fn(), verifyPassword: mocks.verifyPassword }));
vi.mock("@/server/auth/session", () => ({ createSession: mocks.createSession, getCurrentUser: vi.fn(), revokeCurrentSession: vi.fn() }));
vi.mock("@/server/email/provider", () => ({ sendEmail: vi.fn() }));

import { loginAction } from "@/actions/auth";

function loginForm() {
  const form = new FormData();
  form.set("email", "person@example.com");
  form.set("password", "Password1");
  return form;
}

describe("email login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a session for valid active credentials", async () => {
    mocks.findUnique.mockResolvedValue({ id: "user-1", deletedAt: null, status: "ACTIVE", passwordHash: "hash" });
    mocks.verifyPassword.mockResolvedValue(true);
    await expect(loginAction({ ok: false, message: "" }, loginForm())).rejects.toThrow("REDIRECT:/");
    expect(mocks.createSession).toHaveBeenCalledWith("user-1");
  });

  it("routes a V2 role to its primary workspace", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "user-1",
      deletedAt: null,
      status: "ACTIVE",
      passwordHash: "hash",
      roles: [{ role: { name: "Academic Advisor", permissions: [] } }],
      accessScopes: [],
      employeeProfile: { id: "employee-1", organizationAssignments: [] }
    });
    mocks.verifyPassword.mockResolvedValue(true);
    await expect(loginAction({ ok: false, message: "" }, loginForm())).rejects.toThrow("REDIRECT:/advisor/dashboard");
  });

  it("routes an AIRA Labs member to the personal Labs dashboard", async () => {
    mocks.findUnique.mockResolvedValue({ id: "user-1", deletedAt: null, status: "ACTIVE", passwordHash: "hash", roles: [{ role: { name: "AIRA Labs Member", permissions: [] } }], accessScopes: [], employeeProfile: null });
    mocks.verifyPassword.mockResolvedValue(true);
    await expect(loginAction({ ok: false, message: "" }, loginForm())).rejects.toThrow("REDIRECT:/aira-labs/dashboard");
  });

  it("requires email verification before password login", async () => {
    mocks.findUnique.mockResolvedValue({ id: "user-1", deletedAt: null, status: "PENDING_EMAIL_VERIFICATION", passwordHash: "hash" });
    mocks.verifyPassword.mockResolvedValue(true);
    await expect(loginAction({ ok: false, message: "" }, loginForm())).resolves.toEqual({ ok: false, message: "Verify your email before signing in." });
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("rejects an invalid password without creating a session", async () => {
    mocks.findUnique.mockResolvedValue({ id: "user-1", deletedAt: null, status: "ACTIVE", passwordHash: "hash" });
    mocks.verifyPassword.mockResolvedValue(false);
    await expect(loginAction({ ok: false, message: "" }, loginForm())).resolves.toEqual({ ok: false, message: "Email or password is incorrect." });
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("rejects a suspended user", async () => {
    mocks.findUnique.mockResolvedValue({ id: "user-1", deletedAt: null, status: "SUSPENDED", passwordHash: "hash" });
    mocks.verifyPassword.mockResolvedValue(true);
    await expect(loginAction({ ok: false, message: "" }, loginForm())).resolves.toEqual({ ok: false, message: "This account is currently unavailable." });
    expect(mocks.createSession).not.toHaveBeenCalled();
  });
});
