import { describe, expect, it } from "vitest";
import { hasPermission, PERMISSIONS, type AuthorizationUser } from "@/lib/auth/permissions";
import { resolveDefaultV2Workspace } from "@/lib/auth/v2-governance";
import { isAiraLabsHostname } from "@/lib/aira-labs/domain";

function member(): AuthorizationUser {
  return { id: "member-1", roles: [{ role: { name: "AIRA Labs Member" } }] };
}

describe("AIRA Labs public portal", () => {
  it("recognizes only the intended custom domain", () => {
    expect(isAiraLabsHostname("airalabs.com")).toBe(true);
    expect(isAiraLabsHostname("www.airalabs.com:443")).toBe(true);
    expect(isAiraLabsHostname("notairalabs.com")).toBe(false);
    expect(isAiraLabsHostname("airaskillcity.com")).toBe(false);
  });

  it("routes Labs members to their own portal", () => {
    expect(resolveDefaultV2Workspace(member())?.href).toBe("/aira-labs/dashboard");
    expect(hasPermission(member(), PERMISSIONS.LABS_PORTAL_ACCESS)).toBe(true);
  });

  it("does not grant internal product-registry access to Labs members", () => {
    expect(hasPermission(member(), PERMISSIONS.LABS_READ)).toBe(false);
    expect(hasPermission(member(), PERMISSIONS.LABS_MANAGE)).toBe(false);
  });
});
