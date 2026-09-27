import { describe, expect, it } from "vitest";
import { canAccessResource, hasPermission, PERMISSIONS, resolveAuthorizedScopes, type AuthorizationUser } from "@/lib/auth/permissions";

function user(role: string, extra: Partial<AuthorizationUser> = {}): AuthorizationUser {
  return { id: "user-1", roles: [{ role: { name: role } }], ...extra };
}

describe("authorization policy", () => {
  it("preserves full administrative access", () => {
    const admin = user("Admin");
    expect(hasPermission(admin, PERMISSIONS.ADMIN_ACCESS)).toBe(true);
    expect(hasPermission(admin, PERMISSIONS.ORGANIZATION_MANAGE)).toBe(true);
  });

  it("allows student access without granting employee administration", () => {
    const student = user("Student");
    expect(hasPermission(student, PERMISSIONS.STUDENT_ACCESS)).toBe(true);
    expect(hasPermission(student, PERMISSIONS.USER_MANAGE)).toBe(false);
  });

  it("preserves trainer access while denying admissions access", () => {
    const trainer = user("Trainer");
    expect(hasPermission(trainer, PERMISSIONS.TRAINER_ACCESS)).toBe(true);
    expect(hasPermission(trainer, PERMISSIONS.ADMISSIONS_ACCESS)).toBe(false);
  });

  it("allows an own-scope user to access only their record", () => {
    const telecaller = user("Telecaller");
    expect(canAccessResource(telecaller, PERMISSIONS.TELECALLER_ACCESS, { ownerId: "user-1" })).toBe(true);
    expect(canAccessResource(telecaller, PERMISSIONS.TELECALLER_ACCESS, { ownerId: "user-2" })).toBe(false);
  });

  it("allows same-organization access and denies cross-organization access", () => {
    const admission = user("Admission", {
      employeeProfile: { institutionId: "org-1" }
    });
    expect(canAccessResource(admission, PERMISSIONS.ADMISSIONS_ACCESS, { institutionId: "org-1" })).toBe(true);
    expect(canAccessResource(admission, PERMISSIONS.ADMISSIONS_ACCESS, { institutionId: "org-2" })).toBe(false);
  });

  it("uses explicit branch permission and user scope", () => {
    const branchUser: AuthorizationUser = {
      id: "user-1",
      roles: [{ role: { name: "Custom", permissions: [{ scope: "BRANCH", permission: { key: PERMISSIONS.ADMISSIONS_ACCESS, active: true } }] } }],
      accessScopes: [{ scope: "BRANCH", campusId: "branch-1" }]
    };
    expect(canAccessResource(branchUser, PERMISSIONS.ADMISSIONS_ACCESS, { campusId: "branch-1" })).toBe(true);
    expect(canAccessResource(branchUser, PERMISSIONS.ADMISSIONS_ACCESS, { campusId: "branch-2" })).toBe(false);
  });

  it("lets an explicit district assignment narrow a global role grant", () => {
    const scopedAdmin = user("Admin", {
      accessScopes: [{ scope: "DISTRICT", districtId: "district-1" }]
    });
    expect(resolveAuthorizedScopes(scopedAdmin, PERMISSIONS.ADMISSIONS_ACCESS)).toEqual({
      global: false,
      own: false,
      assignments: [{ scope: "DISTRICT", districtId: "district-1" }]
    });
    expect(canAccessResource(scopedAdmin, PERMISSIONS.ADMISSIONS_ACCESS, { districtId: "district-1" })).toBe(true);
    expect(canAccessResource(scopedAdmin, PERMISSIONS.ADMISSIONS_ACCESS, { districtId: "district-2" })).toBe(false);
  });

  it("ignores expired user scope assignments", () => {
    const scoped: AuthorizationUser = {
      id: "user-1",
      roles: [{ role: { name: "Custom", permissions: [{ scope: "DISTRICT", permission: { key: PERMISSIONS.ADMISSIONS_ACCESS, active: true } }] } }],
      accessScopes: [{ scope: "DISTRICT", districtId: "district-1", expiresAt: new Date("2025-01-01") }]
    };
    expect(canAccessResource(scoped, PERMISSIONS.ADMISSIONS_ACCESS, { districtId: "district-1" }, new Date("2026-01-01"))).toBe(false);
  });

  it("treats explicit database permissions as authoritative", () => {
    const restrictedAdmin: AuthorizationUser = {
      id: "user-1",
      roles: [{ role: { name: "Admin", permissions: [{ scope: "GLOBAL", permission: { key: PERMISSIONS.COMMUNITY_ACCESS, active: true } }] } }]
    };
    expect(hasPermission(restrictedAdmin, PERMISSIONS.COMMUNITY_ACCESS)).toBe(true);
    expect(hasPermission(restrictedAdmin, PERMISSIONS.ADMIN_ACCESS)).toBe(false);
  });
});
