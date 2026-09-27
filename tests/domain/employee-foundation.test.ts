import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createEmployeeSchema, employeeAssignmentSchema, normalizeEmployeeCode, updateEmployeeSchema } from "@/features/employees/schemas";
import { managerBelongsToOrganization, reportingLineCreatesCycle } from "@/lib/employees/reporting";
import { hasPermission, PERMISSIONS, type AuthorizationUser } from "@/lib/auth/permissions";
import { getCareerRole } from "@/features/careers/catalog";

const ids = {
  employee: "00000000-0000-4000-8000-000000000001",
  designation: "00000000-0000-4000-8000-000000000002",
  organization: "00000000-0000-4000-8000-000000000003"
};

const baseEmployee = {
  employeeCode: "AIRA-001",
  designationId: ids.designation,
  institutionId: ids.organization,
  employmentType: "FULL_TIME",
  status: "ACTIVE",
  joinedAt: "2026-01-01"
};

describe("employee foundation", () => {
  it("validates employee creation and normalizes a stable employee code", () => {
    const result = createEmployeeSchema.safeParse({ userEmail: " Person@Aira.test ", ...baseEmployee });
    expect(result.success).toBe(true);
    expect(result.success && result.data.userEmail).toBe("person@aira.test");
    expect(normalizeEmployeeCode(" aira-001 ")).toBe("AIRA-001");
  });

  it("validates updates and rejects an exit date before joining", () => {
    expect(updateEmployeeSchema.safeParse({ employeeId: ids.employee, ...baseEmployee, exitedAt: "2025-12-31" }).success).toBe(false);
    expect(updateEmployeeSchema.safeParse({ employeeId: ids.employee, ...baseEmployee, status: "ON_NOTICE", exitedAt: "2026-03-31" }).success).toBe(true);
  });

  it("supports effective-dated additional assignments", () => {
    expect(employeeAssignmentSchema.safeParse({ employeeId: ids.employee, institutionId: ids.organization, startsAt: "2026-01-01", endsAt: "2026-06-01" }).success).toBe(true);
    expect(employeeAssignmentSchema.safeParse({ employeeId: ids.employee, institutionId: ids.organization, startsAt: "2026-06-01", endsAt: "2026-01-01" }).success).toBe(false);
  });

  it("detects direct and indirect reporting cycles", () => {
    const lines = [{ id: "a", managerId: "b" }, { id: "b", managerId: "c" }, { id: "c", managerId: null }];
    expect(reportingLineCreatesCycle("c", "a", lines)).toBe(true);
    expect(reportingLineCreatesCycle("a", "c", lines)).toBe(false);
    expect(reportingLineCreatesCycle("a", "a", lines)).toBe(true);
  });

  it("requires a manager to share a primary or active assignment organization", () => {
    expect(managerBelongsToOrganization("org-1", [], "org-1")).toBe(true);
    expect(managerBelongsToOrganization("org-1", ["org-2"], "org-2")).toBe(true);
    expect(managerBelongsToOrganization("org-1", ["org-2"], "org-3")).toBe(false);
  });

  it("keeps designation structurally separate from authorization roles", () => {
    const schema = readFileSync(new URL("../../prisma/schema.prisma", import.meta.url), "utf8");
    const designationModel = schema.match(/model Designation \{[\s\S]*?\n\}/)?.[0] ?? "";
    expect(designationModel).not.toContain("permissions");
    expect(schema).toMatch(/designation\s+Designation\?/);
    const hr: AuthorizationUser = { id: "hr", roles: [{ role: { name: "HR Manager" } }], employeeProfile: { institutionId: "org-1" } };
    expect(hasPermission(hr, PERMISSIONS.EMPLOYEE_MANAGE)).toBe(true);
  });

  it("preserves trainer and academic-advisor operational structures", () => {
    const schema = readFileSync(new URL("../../prisma/schema.prisma", import.meta.url), "utf8");
    expect(schema).toContain("model TrainerAssignment");
    expect(schema).toMatch(/trainer\s+User\s+@relation\("TrainerAssignments"/);
    expect(getCareerRole("academic-advisor")?.title).toBe("Academic Advisor");
  });
});
