import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ readiness: vi.fn() }));
vi.mock("@/server/health/readiness", () => ({ checkApplicationReadiness: mocks.readiness }));

import { GET } from "@/app/api/health/route";

describe("application health route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reports ready without exposing internals", async () => {
    mocks.readiness.mockResolvedValue(true);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ status: "ready" });
  });

  it("fails closed when required database state is absent", async () => {
    mocks.readiness.mockResolvedValue(false);
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "unavailable" });
  });

  it("does not expose database errors", async () => {
    mocks.readiness.mockRejectedValue(new Error("postgresql://secret@database"));
    const response = await GET();
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain("postgresql");
  });
});
