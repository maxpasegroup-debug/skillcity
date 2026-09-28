import { describe, expect, it } from "vitest";
import { createLabsProductSchema, labsContributorSchema } from "@/features/labs/schemas";
import { assignmentCoversLabsProduct, assignmentWindowsOverlap, isEffectiveLabsAssignment, LABS_PRODUCT_LIFECYCLES, LABS_PRODUCT_TYPES, normalizeLabsProductCode } from "@/lib/labs/product";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { labsProductScopeWhere } from "@/server/auth/scoping";

const id = (suffix: string) => `00000000-0000-4000-8000-0000000000${suffix}`;

function role(name: string) { return [{ role: { name } }]; }

describe("AIRA Labs product foundation", () => {
  it("normalizes a stable URL-safe product code", () => {
    expect(normalizeLabsProductCode("  core-platform  ")).toBe("core-platform");
  });

  it("uses a focused controlled type and lifecycle catalog", () => {
    expect(LABS_PRODUCT_TYPES).toContain("AI_PRODUCT");
    expect(LABS_PRODUCT_LIFECYCLES).toEqual(["IDEA", "PLANNING", "BUILDING", "PILOT", "LIVE", "MAINTENANCE", "ARCHIVED"]);
  });

  it("validates product creation with organization and owner identity", () => {
    const result = createLabsProductSchema.safeParse({ name: "Core Platform", code: "core-platform", description: "Central operating product for AIRA.", type: "PLATFORM", lifecycle: "IDEA", institutionId: id("01"), divisionId: id("02"), ownerId: id("03") });
    expect(result.success).toBe(true);
  });

  it("rejects an unsafe product code", () => {
    const result = createLabsProductSchema.safeParse({ name: "Core Platform", code: "Core Platform!", description: "Central operating product for AIRA.", type: "PLATFORM", lifecycle: "IDEA", institutionId: id("01"), divisionId: id("02"), ownerId: id("03") });
    expect(result.success).toBe(false);
  });

  it("evaluates effective assignment dates", () => {
    const now = new Date("2026-09-28T10:00:00Z");
    expect(isEffectiveLabsAssignment({ status: "ACTIVE", startsAt: new Date("2026-09-01"), endsAt: new Date("2026-10-01") }, now)).toBe(true);
    expect(isEffectiveLabsAssignment({ status: "ACTIVE", startsAt: new Date("2026-10-01") }, now)).toBe(false);
    expect(isEffectiveLabsAssignment({ status: "INACTIVE", startsAt: new Date("2026-09-01") }, now)).toBe(false);
  });

  it("rejects invalid contributor dates", () => {
    const result = labsContributorSchema.safeParse({ productId: id("01"), employeeId: id("02"), responsibility: "Developer", startsAt: "2026-10-02T09:00", endsAt: "2026-10-01T09:00" });
    expect(result.success).toBe(false);
  });

  it("requires compatible Employee organization placement", () => {
    const product = { institutionId: "org-1", divisionId: "labs", campusId: "centre-1" };
    expect(assignmentCoversLabsProduct({ institutionId: "org-1", divisionId: "labs" }, product)).toBe(true);
    expect(assignmentCoversLabsProduct({ institutionId: "org-1", divisionId: "school" }, product)).toBe(false);
    expect(assignmentCoversLabsProduct({ institutionId: "org-2" }, product)).toBe(false);
  });

  it("detects overlapping ownership windows", () => {
    expect(assignmentWindowsOverlap({ startsAt: new Date("2026-09-01"), endsAt: new Date("2026-10-01") }, { startsAt: new Date("2026-09-15") })).toBe(true);
    expect(assignmentWindowsOverlap({ startsAt: new Date("2026-09-01"), endsAt: new Date("2026-09-15") }, { startsAt: new Date("2026-09-15") })).toBe(false);
  });

  it("builds organization-scoped product visibility", () => {
    const actor = { id: "hod", roles: role("HOD"), employeeProfile: { institutionId: "org-1" } };
    expect(JSON.stringify(labsProductScopeWhere(actor, PERMISSIONS.LABS_READ))).toContain("org-1");
  });

  it("builds assignment ownership visibility for OWN grants", () => {
    const actor = { id: "owner-user", roles: [{ role: { name: "Custom", permissions: [{ scope: "OWN" as const, permission: { key: "labs.read", active: true } }] } }] };
    const predicate = JSON.stringify(labsProductScopeWhere(actor, PERMISSIONS.LABS_READ));
    expect(predicate).toContain("owner-user");
    expect(predicate).toContain("assignments");
  });
});
