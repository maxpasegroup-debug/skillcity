import { describe, expect, it } from "vitest";
import { hasPermission, PERMISSIONS, ROLE_KEYS, type AuthorizationUser } from "@/lib/auth/permissions";
import { availableV2Workspaces, canAssignV2Role, resolveConversationalAssistantEntryPoint, resolveDefaultV2Workspace, resolveSiaEntryPoint, SIA_GOVERNANCE, V2_DESIGNATIONS, V2_ROLE_DEFINITIONS } from "@/lib/auth/v2-governance";

function user(role: string, extra: Partial<AuthorizationUser> = {}): AuthorizationUser {
  return { id: "user-1", roles: [{ role: { name: role } }], ...extra };
}

describe("AIRA Skill City V2 role governance", () => {
  it("keeps the locked role and designation catalogs unique", () => {
    expect(new Set(V2_ROLE_DEFINITIONS.map((role) => role.key)).size).toBe(V2_ROLE_DEFINITIONS.length);
    expect(new Set(V2_DESIGNATIONS.map(([key]) => key)).size).toBe(V2_DESIGNATIONS.length);
  });

  it("models senior and junior advisor as designations under one authorization role", () => {
    expect(V2_ROLE_DEFINITIONS.filter((role) => role.name.includes("Academic Advisor"))).toHaveLength(1);
    expect(V2_DESIGNATIONS.map(([, name]) => name)).toEqual(expect.arrayContaining(["Senior Academic Advisor", "Junior Academic Advisor"]));
  });

  it("gives CEO business-wide governance without platform administration", () => {
    const actor = user("CEO");
    expect(hasPermission(actor, PERMISSIONS.USER_MANAGE)).toBe(true);
    expect(hasPermission(actor, PERMISSIONS.ADMISSIONS_MANAGE)).toBe(true);
    expect(hasPermission(actor, PERMISSIONS.ADMIN_ACCESS)).toBe(false);
    expect(resolveDefaultV2Workspace(actor)?.key).toBe("CEO");
  });

  it("keeps Director operationally broad but unable to manage identities", () => {
    const actor = user("Director");
    expect(hasPermission(actor, PERMISSIONS.LABS_MANAGE)).toBe(true);
    expect(hasPermission(actor, PERMISSIONS.USER_MANAGE)).toBe(false);
    expect(hasPermission(actor, PERMISSIONS.ADMIN_ACCESS)).toBe(false);
    expect(resolveDefaultV2Workspace(actor)?.key).toBe("DIRECTOR");
  });

  it("separates platform administration from business authority", () => {
    const actor = user("Platform Administrator");
    expect(hasPermission(actor, PERMISSIONS.ADMIN_ACCESS)).toBe(true);
    expect(hasPermission(actor, PERMISSIONS.USER_MANAGE)).toBe(true);
    expect(hasPermission(actor, PERMISSIONS.ADMISSIONS_MANAGE)).toBe(false);
    expect(canAssignV2Role(actor, ROLE_KEYS.ADMISSION_OFFICER)).toBe(true);
    expect(canAssignV2Role(actor, ROLE_KEYS.CEO)).toBe(false);
    expect(canAssignV2Role(actor, ROLE_KEYS.COO)).toBe(false);
  });

  it("reserves protected role assignment for CEO", () => {
    const actor = user("CEO");
    expect(canAssignV2Role(actor, ROLE_KEYS.CEO)).toBe(true);
    expect(canAssignV2Role(actor, ROLE_KEYS.PLATFORM_ADMIN)).toBe(true);
  });

  it("resolves scoped department and employee workspaces predictably", () => {
    const admissions = user("Admission Officer", { employeeProfile: { id: "employee-1", institutionId: "org-1" } });
    expect(resolveDefaultV2Workspace(admissions)?.key).toBe("ADMISSIONS");
    expect(availableV2Workspaces(admissions).map((workspace) => workspace.key)).toContain("EMPLOYEE");
  });

  it("prioritizes an exact role workspace over overlapping permissions", () => {
    expect(resolveDefaultV2Workspace(user("Academic Head"))?.key).toBe("ACADEMIC");
    expect(resolveDefaultV2Workspace(user("Academic Advisor"))?.href).toBe("/advisor/dashboard");
    expect(resolveDefaultV2Workspace(user("Telecaller"))?.href).toBe("/telecaller");
    expect(resolveDefaultV2Workspace(user("Hub Coordinator"))?.key).toBe("HUB");
  });

  it("routes SIA operators through the governed operating centre", () => {
    expect(resolveSiaEntryPoint(user("CEO"))?.href).toBe("/sia");
    expect(resolveConversationalAssistantEntryPoint(user("CEO"))?.href).toBe("/executive/ai-command-center");
    expect(resolveSiaEntryPoint(user("Academic Advisor"))).toBeNull();
  });

  it("lets department heads approve only within their assigned scope", () => {
    const actor = user("Finance & Compliance Head", { employeeProfile: { id: "employee-1", institutionId: "org-1" } });
    expect(hasPermission(actor, PERMISSIONS.AI_USE)).toBe(true);
    expect(hasPermission(actor, PERMISSIONS.AI_APPROVE)).toBe(true);
  });

  it("keeps SIA inside a proposal and human-approval boundary", () => {
    expect(SIA_GOVERNANCE.mayReadOnlyWithinActorScope).toBe(true);
    expect(SIA_GOVERNANCE.mayPropose).toBe(true);
    expect(SIA_GOVERNANCE.mayExecutePrivilegedMutation).toBe(false);
    expect(SIA_GOVERNANCE.humanApprovalRequired).toBe(true);
  });
});
