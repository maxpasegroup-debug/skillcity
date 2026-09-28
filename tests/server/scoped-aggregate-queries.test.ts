import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthorizationUser } from "@/lib/auth/permissions";

const state = vi.hoisted(() => ({
  user: null as AuthorizationUser | null,
  count: vi.fn(async (...args: unknown[]) => { void args; return 0; }),
  aggregate: vi.fn(async (...args: unknown[]) => { void args; return { _sum: { amount: 0, estimatedTokens: 0, priceCoins: 0 }, _count: 0 }; }),
  findMany: vi.fn(async (...args: unknown[]) => { void args; return []; }),
  groupBy: vi.fn(async (...args: unknown[]) => { void args; return []; })
}));

vi.mock("@/server/auth/authorization", () => ({
  requirePermission: vi.fn(async () => state.user)
}));

vi.mock("@/lib/prisma", () => ({
  prisma: new Proxy({}, {
    get: () => ({
      count: state.count,
      aggregate: state.aggregate,
      findMany: state.findMany,
      groupBy: state.groupBy
    })
  })
}));

import { getAdmissionDashboard } from "@/server/admissions/queries";
import { getCrmFunnel } from "@/server/crm/queries";
import { getRecruitmentOverview } from "@/server/careers/queries";
import { getExecutiveDashboard } from "@/server/executive/queries";

function actor(scope?: NonNullable<AuthorizationUser["accessScopes"]>[number]): AuthorizationUser {
  return {
    id: "executive-1",
    roles: [{ role: { name: "Admin" } }],
    accessScopes: scope ? [scope] : []
  };
}

function callsFor(mock: { mock: { calls: Array<[unknown?, ...unknown[]]> } }) {
  return mock.mock.calls.map(([input]) => JSON.stringify(input));
}

describe("scoped aggregate queries", () => {
  beforeEach(() => {
    state.user = actor();
    state.count.mockClear();
    state.aggregate.mockClear();
    state.findMany.mockClear();
    state.groupBy.mockClear();
  });

  it("applies branch scope to every admissions aggregate and related list", async () => {
    state.user = actor({ scope: "BRANCH", campusId: "branch-1" });
    await getAdmissionDashboard();

    const calls = [...callsFor(state.count), ...callsFor(state.aggregate), ...callsFor(state.findMany)];
    expect(calls.length).toBeGreaterThan(10);
    expect(calls.every((call) => call.includes("branch-1"))).toBe(true);
    expect(calls.some((call) => call.includes("branch-2"))).toBe(false);
  });

  it("applies district scope to every CRM funnel stage", async () => {
    state.user = actor({ scope: "DISTRICT", districtId: "district-1" });
    await getCrmFunnel();

    const calls = callsFor(state.count);
    expect(calls).toHaveLength(8);
    expect(calls.every((call) => call.includes("district-1"))).toBe(true);
    expect(calls.some((call) => call.includes("district-2"))).toBe(false);
  });

  it("applies recruitment scope to counts, grouped reports, details, and interviews", async () => {
    state.user = actor({ scope: "DISTRICT", districtId: "district-1" });
    await getRecruitmentOverview();

    const calls = [...callsFor(state.count), ...callsFor(state.groupBy), ...callsFor(state.findMany)];
    expect(calls.length).toBeGreaterThan(12);
    expect(calls.every((call) => call.includes("district-1"))).toBe(true);
  });

  it("applies district scope to executive KPIs", async () => {
    state.user = actor({ scope: "DISTRICT", districtId: "district-1" });
    await getExecutiveDashboard();

    const scopedCalls = [...callsFor(state.count), ...callsFor(state.aggregate), ...callsFor(state.findMany)]
      .filter((call) => !call.includes("00000000-0000-0000-0000-000000000000"));
    expect(scopedCalls.some((call) => call.includes("district-1"))).toBe(true);
    expect(scopedCalls.some((call) => call.includes("district-2"))).toBe(false);
  });

  it("applies division scope to executive KPIs", async () => {
    state.user = actor({ scope: "DIVISION", divisionId: "division-1" });
    await getExecutiveDashboard();

    const calls = [...callsFor(state.count), ...callsFor(state.aggregate), ...callsFor(state.findMany)];
    expect(calls.some((call) => call.includes("division-1"))).toBe(true);
    expect(calls.some((call) => call.includes("division-2"))).toBe(false);
  });

  it("keeps global executive KPI predicates unrestricted", async () => {
    state.user = actor();
    await getExecutiveDashboard();

    expect(state.count.mock.calls.some(([input]) => JSON.stringify(input) === '{"where":{}}')).toBe(true);
    expect([...callsFor(state.count), ...callsFor(state.aggregate), ...callsFor(state.findMany)].join(" ")).not.toContain("00000000-0000-0000-0000-000000000000");
  });
});
