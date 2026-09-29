import { describe, expect, it } from "vitest";
import { PERMISSIONS, type AuthorizationUser } from "@/lib/auth/permissions";
import { filterAuthorizedAIProposals, proposalResourceScope } from "@/server/ai/governance";

function scopedApprover(): AuthorizationUser {
  return {
    id: "head-1",
    roles: [{ role: { name: "Finance & Compliance Head" } }],
    employeeProfile: { institutionId: "org-1" }
  };
}

describe("V2 SIA governance", () => {
  it("normalizes only supported organization context fields", () => {
    expect(proposalResourceScope({ institutionId: "org-1", ownerId: "user-1", injected: "ignored" })).toEqual({ institutionId: "org-1", ownerId: "user-1" });
    expect(proposalResourceScope(["org-1"])).toEqual({});
  });

  it("hides cross-organization proposals from scoped approvers", () => {
    const proposals = [
      { id: "own-org", organizationContext: { institutionId: "org-1", ownerId: "employee-2" } },
      { id: "other-org", organizationContext: { institutionId: "org-2", ownerId: "employee-3" } }
    ];
    expect(filterAuthorizedAIProposals(scopedApprover(), proposals).map((item) => item.id)).toEqual(["own-org"]);
  });

  it("keeps audit results scoped independently from approval permission", () => {
    const technologyHead: AuthorizationUser = {
      id: "tech-1",
      roles: [{ role: { name: "Technology & Products Head" } }],
      employeeProfile: { institutionId: "org-1" }
    };
    const proposals = [{ id: "visible", organizationContext: { institutionId: "org-1" } }, { id: "hidden", organizationContext: { institutionId: "org-2" } }];
    expect(filterAuthorizedAIProposals(technologyHead, proposals, PERMISSIONS.AI_AUDIT).map((item) => item.id)).toEqual(["visible"]);
  });
});
