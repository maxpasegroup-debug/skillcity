import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthorizationUser } from "@/lib/auth/permissions";

const state = vi.hoisted(() => ({
  actor: null as AuthorizationUser | null,
  count: vi.fn<(input: unknown) => Promise<number>>().mockResolvedValue(0),
  aggregate: vi.fn<(input: unknown) => Promise<{ _count: number; _sum: { amount: null; inputTokens: null; outputTokens: null } }>>().mockResolvedValue({ _count: 0, _sum: { amount: null, inputTokens: null, outputTokens: null } }),
  groupBy: vi.fn<(input: unknown) => Promise<never[]>>().mockResolvedValue([])
}));

vi.mock("@/server/auth/authorization", () => ({ requirePermission: vi.fn(async () => { if (!state.actor) throw new Error("Unauthorized"); return state.actor; }) }));
vi.mock("@/lib/prisma", () => ({ prisma: new Proxy({}, { get: () => ({ count: state.count, aggregate: state.aggregate, groupBy: state.groupBy }) }) }));

import { getExecutiveIntelligence } from "@/server/analytics/queries";

function actor(scope: NonNullable<AuthorizationUser["accessScopes"]>[number]): AuthorizationUser {
  return { id: "executive-1", roles: [{ role: { name: "Custom", permissions: [{ scope: scope.scope, permission: { key: "executive.access", active: true } }] } }], accessScopes: [scope] };
}

function allCalls() { return [...state.count.mock.calls, ...state.aggregate.mock.calls, ...state.groupBy.mock.calls].map(([input]) => JSON.stringify(input)); }

describe("executive analytics scope enforcement", () => {
  beforeEach(() => { state.actor = actor({ scope: "ORGANIZATION", institutionId: "org-1" }); state.count.mockClear(); state.aggregate.mockClear(); state.groupBy.mockClear(); });

  for (const [scope, key, value] of [
    ["ORGANIZATION", "institutionId", "org-1"], ["DIVISION", "divisionId", "division-1"], ["DISTRICT", "districtId", "district-1"], ["BRANCH", "campusId", "branch-1"], ["DEPARTMENT", "departmentId", "department-1"]
  ] as const) {
    it(`applies ${scope.toLowerCase()} scope across analytics queries`, async () => {
      state.actor = actor({ scope, [key]: value });
      await getExecutiveIntelligence("THIS_MONTH", new Date("2026-09-29T00:00:00Z"));
      const calls = allCalls();
      expect(calls.some((call) => call.includes(value))).toBe(true);
      expect(calls.join(" ")).not.toContain("outside-scope");
    });
  }

  it("blocks unauthorized aggregate access before querying", async () => {
    state.actor = null;
    await expect(getExecutiveIntelligence()).rejects.toThrow("Unauthorized");
    expect(state.count).not.toHaveBeenCalled();
  });
});
