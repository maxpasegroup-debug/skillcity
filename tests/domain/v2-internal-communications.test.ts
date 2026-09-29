import { describe, expect, it } from "vitest";
import { hasPermission, PERMISSIONS, type AuthorizationUser } from "@/lib/auth/permissions";
import { canPostInternalMessage, isActiveInternalCommunicationEmployee, uniqueChannelMemberIds } from "@/lib/communications/internal-channels";

function user(role: string): AuthorizationUser {
  return { id: "actor", roles: [{ role: { name: role } }] };
}

describe("V2 internal communications", () => {
  it("allows department heads to manage scoped channels", () => {
    const actor = user("Academic Head");
    expect(hasPermission(actor, PERMISSIONS.INTERNAL_COMMUNICATIONS_READ)).toBe(true);
    expect(hasPermission(actor, PERMISSIONS.INTERNAL_COMMUNICATIONS_SEND)).toBe(true);
    expect(hasPermission(actor, PERMISSIONS.INTERNAL_COMMUNICATIONS_MANAGE)).toBe(true);
  });

  it("allows frontline employees to communicate without channel-management authority", () => {
    for (const role of ["Academic Advisor", "Trainer", "Admission Officer", "Telecaller", "Counsellor"]) {
      const actor = user(role);
      expect(hasPermission(actor, PERMISSIONS.INTERNAL_COMMUNICATIONS_READ)).toBe(true);
      expect(hasPermission(actor, PERMISSIONS.INTERNAL_COMMUNICATIONS_SEND)).toBe(true);
      expect(hasPermission(actor, PERMISSIONS.INTERNAL_COMMUNICATIONS_MANAGE)).toBe(false);
    }
  });

  it("does not enroll students into the employee channel permission set", () => {
    expect(hasPermission(user("Student"), PERMISSIONS.INTERNAL_COMMUNICATIONS_READ)).toBe(false);
  });

  it("allows every active member to post in team channels", () => {
    expect(canPostInternalMessage("TEAM", "MEMBER")).toBe(true);
  });

  it("reserves announcement publishing for owners and moderators", () => {
    expect(canPostInternalMessage("ANNOUNCEMENT", "MEMBER")).toBe(false);
    expect(canPostInternalMessage("ANNOUNCEMENT", "MODERATOR")).toBe(true);
    expect(canPostInternalMessage("ANNOUNCEMENT", "OWNER")).toBe(true);
  });

  it("deduplicates submitted members and excludes the creator", () => {
    expect(uniqueChannelMemberIds(["actor", "one", "one", "two"], "actor")).toEqual(["one", "two"]);
  });

  it("requires an active employment state independently of role permission", () => {
    expect(isActiveInternalCommunicationEmployee({ ...user("Trainer"), employeeProfile: { id: "employee", status: "ACTIVE" } })).toBe(true);
    expect(isActiveInternalCommunicationEmployee({ ...user("Trainer"), employeeProfile: { id: "employee", status: "EXITED" } })).toBe(false);
    expect(isActiveInternalCommunicationEmployee(user("Trainer"))).toBe(false);
  });
});
