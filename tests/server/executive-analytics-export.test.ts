import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ currentUser: vi.fn(), intelligence: vi.fn(), audit: vi.fn() }));
vi.mock("@/server/auth/session", () => ({ getCurrentUser: mocks.currentUser }));
vi.mock("@/server/analytics/queries", () => ({ getExecutiveIntelligence: mocks.intelligence }));
vi.mock("@/lib/prisma", () => ({ prisma: { platformAudit: { create: mocks.audit } } }));

import { GET } from "@/app/api/executive/analytics/export/route";

const base = {
  range: { period: "THIS_MONTH", timeZone: "Asia/Kolkata" },
  admissions: { leads: 2, applications: 1, conversionPercent: 50 },
  learning: { activeEnrollments: 4 }, labs: { activeProducts: 1 }, career: { openOpportunities: 3 }, people: { activeEmployees: 5 },
  operations: { communicationFailed: 0, automationFailed: 0 }, ai: { requests: 2 }, finance: { currencies: [] }
};

describe("executive analytics export", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.intelligence.mockResolvedValue(base); mocks.audit.mockResolvedValue({}); });

  it("blocks an unauthenticated export", async () => {
    mocks.currentUser.mockResolvedValue(null);
    const response = await GET(new Request("http://localhost/api/executive/analytics/export"));
    expect(response.status).toBe(401);
    expect(mocks.intelligence).not.toHaveBeenCalled();
  });

  it("blocks users without executive permission", async () => {
    mocks.currentUser.mockResolvedValue({ id: "student-1", roles: [{ role: { name: "Student" } }] });
    const response = await GET(new Request("http://localhost/api/executive/analytics/export"));
    expect(response.status).toBe(403);
    expect(mocks.audit).not.toHaveBeenCalled();
  });

  it("exports only aggregate visible metrics and audits the operation", async () => {
    mocks.currentUser.mockResolvedValue({ id: "director-1", roles: [{ role: { name: "Director" } }] });
    const response = await GET(new Request("http://localhost/api/executive/analytics/export?period=THIS_MONTH"));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(await response.text()).toContain("admissions.leads");
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "EXECUTIVE_ANALYTICS_EXPORTED", actorId: "director-1" }) }));
  });
});
