import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashToken } from "@/lib/security/token";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(), checkRateLimit: vi.fn(), ensurePipeline: vi.fn(), applicationCreate: vi.fn(),
  leadFindFirst: vi.fn(), leadCreate: vi.fn(), leadActivityCreate: vi.fn()
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers({ "x-forwarded-for": "203.0.113.10" })) }));
vi.mock("@/lib/security/rate-limit", () => ({ checkRateLimit: mocks.checkRateLimit }));
vi.mock("@/server/admissions/queries", () => ({ ensureDefaultPipeline: mocks.ensurePipeline }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  admissionApplication: { findFirst: mocks.findFirst },
  leadSource: { upsert: vi.fn(async () => ({ id: "source-1" })) },
  program: { upsert: vi.fn(async () => ({ id: "program-1" })) },
  user: { findUnique: vi.fn(async () => null) },
  $transaction: vi.fn(async (callback: (tx: unknown) => unknown) => callback({
    lead: { findFirst: mocks.leadFindFirst, create: mocks.leadCreate },
    leadActivity: { create: mocks.leadActivityCreate },
    referral: { findFirst: vi.fn(), create: vi.fn() },
    admissionApplication: { findFirst: mocks.findFirst, create: mocks.applicationCreate, update: vi.fn() }
  }))
} }));

import { checkApplicationStatusAction, submitPublicApplicationAction } from "@/actions/public-application";

const reference = "A2345678901234567890123456789012";
function form(whatsapp: string, applicationReference: string) {
  const data = new FormData();
  data.set("whatsapp", whatsapp);
  data.set("applicationReference", applicationReference);
  return data;
}

describe("public application status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.ensurePipeline.mockResolvedValue([{ id: "stage-1", slug: "application-submitted" }]);
    mocks.leadFindFirst.mockResolvedValue(null);
    mocks.leadCreate.mockResolvedValue({ id: "lead-1" });
    mocks.leadActivityCreate.mockResolvedValue({ id: "activity-1" });
    mocks.applicationCreate.mockResolvedValue({ id: "internal-application-id" });
  });

  it("returns status only when the contact and opaque reference match", async () => {
    mocks.findFirst.mockResolvedValue({ status: "SUBMITTED", program: { name: "Program" }, studentLoginCredentials: [] });
    const result = await checkApplicationStatusAction({ ok: false, message: "" }, form("+919876543210", reference));
    expect(result.ok).toBe(true);
    expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ publicLookupTokenHash: hashToken(reference) }) }));
  });

  it("uses the same response for unknown, wrong, and malformed references", async () => {
    mocks.findFirst.mockResolvedValue(null);
    const unknown = await checkApplicationStatusAction({ ok: false, message: "" }, form("+919876543210", reference));
    const wrong = await checkApplicationStatusAction({ ok: false, message: "" }, form("+919876543210", "B2345678901234567890123456789012"));
    const malformed = await checkApplicationStatusAction({ ok: false, message: "" }, form("+919876543210", "../../crafted"));
    expect(unknown).toEqual(wrong);
    expect(wrong).toEqual(malformed);
    expect(unknown.title).toBe("Unable to verify");
  });

  it("rate limits repeated status checks", async () => {
    mocks.checkRateLimit.mockResolvedValue({ allowed: false });
    const result = await checkApplicationStatusAction({ ok: false, message: "" }, form("+919876543210", reference));
    expect(result.title).toBe("Please wait");
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("returns an opaque reference after submission without exposing the internal application ID", async () => {
    mocks.findFirst.mockResolvedValue(null);
    const data = new FormData();
    Object.entries({ programSlug: "startup-skool", name: "Applicant Name", whatsapp: "+919876543210", city: "Kozhikode", goal: "Build a company" }).forEach(([key, value]) => data.set(key, value));
    const result = await submitPublicApplicationAction({ ok: false, message: "" }, data);
    expect(result.ok).toBe(true);
    expect(result.applicationReference).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(result).not.toHaveProperty("applicationId");
    expect(mocks.applicationCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ publicLookupTokenHash: hashToken(result.applicationReference!) }) }));
  });
});
