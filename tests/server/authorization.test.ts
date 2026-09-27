import { beforeEach, describe, expect, it, vi } from "vitest";
import { PERMISSIONS } from "@/lib/auth/permissions";

const mocks = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));

vi.mock("@/server/auth/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));

import { assertPermission, AuthorizationError, requirePermission } from "@/server/auth/authorization";

function roleUser(role: string) {
  return { id: "user-1", roles: [{ role: { name: role } }], accessScopes: [], employeeProfile: null };
}

describe("server authorization boundary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns an authorized admin", async () => {
    mocks.getCurrentUser.mockResolvedValue(roleUser("Admin"));
    await expect(requirePermission(PERMISSIONS.ADMIN_ACCESS, "/admin-login")).resolves.toMatchObject({ id: "user-1" });
  });

  it("redirects an anonymous protected-route request to login", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    await expect(requirePermission(PERMISSIONS.ADMIN_ACCESS, "/admin-login")).rejects.toThrow("REDIRECT:/admin-login");
  });

  it("redirects an unauthorized student away from an admin route", async () => {
    mocks.getCurrentUser.mockResolvedValue(roleUser("Student"));
    await expect(requirePermission(PERMISSIONS.ADMIN_ACCESS)).rejects.toThrow("REDIRECT:/dashboard");
  });

  it("rejects an unauthorized server action", async () => {
    mocks.getCurrentUser.mockResolvedValue(roleUser("Student"));
    await expect(assertPermission(PERMISSIONS.ORGANIZATION_MANAGE)).rejects.toBeInstanceOf(AuthorizationError);
  });
});
