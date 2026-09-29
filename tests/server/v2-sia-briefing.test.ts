import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  employeeCount: vi.fn(),
  applicationCount: vi.fn(),
  batchCount: vi.fn(),
  invoiceCount: vi.fn(),
  productCount: vi.fn(),
  opportunityCount: vi.fn(),
  notificationCount: vi.fn(),
  channelCount: vi.fn(),
  proposalFindMany: vi.fn()
}));

vi.mock("@/server/auth/authorization", () => ({ requirePermission: mocks.requirePermission }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  employee: { count: mocks.employeeCount },
  admissionApplication: { count: mocks.applicationCount },
  batch: { count: mocks.batchCount },
  feeInvoice: { count: mocks.invoiceCount },
  labsProduct: { count: mocks.productCount },
  careerOpportunity: { count: mocks.opportunityCount },
  notification: { count: mocks.notificationCount },
  internalChannelMember: { count: mocks.channelCount },
  aIActionProposal: { findMany: mocks.proposalFindMany }
} }));
vi.mock("@/server/auth/scoping", () => ({
  employeeScopeWhere: () => ({ institutionId: "org-1" }),
  applicationScopeWhere: () => ({ lead: { institutionId: "org-1" } }),
  batchScopeWhere: () => ({ campus: { institutionId: "org-1" } }),
  feeInvoiceScopeWhere: () => ({ institutionId: "org-1" }),
  labsProductScopeWhere: () => ({ institutionId: "org-1" }),
  careerOpportunityScopeWhere: () => ({ institutionId: "org-1" })
}));

import { getSiaOperatingBriefing } from "@/server/sia/briefing";

describe("V2 SIA operating briefing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requirePermission.mockResolvedValue({ id: "ceo-1", name: "CEO", roles: [{ role: { name: "CEO" } }] });
    mocks.employeeCount.mockResolvedValue(10);
    mocks.applicationCount.mockResolvedValue(2);
    mocks.batchCount.mockResolvedValue(3);
    mocks.invoiceCount.mockResolvedValue(4);
    mocks.productCount.mockResolvedValue(5);
    mocks.opportunityCount.mockResolvedValue(6);
    mocks.notificationCount.mockResolvedValue(7);
    mocks.channelCount.mockResolvedValue(8);
    mocks.proposalFindMany.mockResolvedValue([{ id: "proposal-1", organizationContext: { institutionId: "org-1" } }]);
  });

  it("builds source-system metrics through scoped domain predicates", async () => {
    const briefing = await getSiaOperatingBriefing();
    expect(briefing.areas.map((area) => [area.key, area.count])).toEqual([
      ["people", 10], ["admissions", 2], ["academic", 3], ["finance", 4], ["technology", 5], ["career", 6]
    ]);
    expect(mocks.employeeCount).toHaveBeenCalledWith(expect.objectContaining({ where: { AND: [expect.objectContaining({ institutionId: "org-1" }), expect.any(Object)] } }));
    expect(mocks.applicationCount).toHaveBeenCalledWith(expect.objectContaining({ where: { AND: [expect.objectContaining({ lead: { institutionId: "org-1" } }), expect.any(Object)] } }));
    expect(briefing.unreadNotifications).toBe(7);
    expect(briefing.channelMemberships).toBe(8);
    expect(briefing.proposals).toHaveLength(1);
    expect(briefing.canApprove).toBe(true);
  });
});
