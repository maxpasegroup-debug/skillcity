import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveEmployeeOrganizationScopes, validateOrganizationPath } from "@/lib/organization/hierarchy";
import { PERMISSIONS, resolveAuthorizedScopes, type AuthorizationUser } from "@/lib/auth/permissions";

describe("organization foundation", () => {
  it("accepts an organization, division, district, centre, and department in one hierarchy", () => {
    const result = validateOrganizationPath(
      { institutionId: "org-1", divisionId: "division-1", districtId: "district-1", campusId: "campus-1", departmentId: "department-1" },
      {
        division: { id: "division-1", institutionId: "org-1" },
        district: { id: "district-1", institutionId: "org-1" },
        campus: { id: "campus-1", institutionId: "org-1", districtId: "district-1" },
        department: { id: "department-1", institutionId: "org-1", divisionId: "division-1", campusId: "campus-1" }
      }
    );
    expect(result).toEqual({ valid: true, issues: [] });
  });

  it("rejects cross-organization and mismatched centre relationships", () => {
    const result = validateOrganizationPath(
      { institutionId: "org-1", districtId: "district-1", campusId: "campus-2" },
      {
        district: { id: "district-1", institutionId: "org-1" },
        campus: { id: "campus-2", institutionId: "org-2", districtId: "district-2" }
      }
    );
    expect(result.valid).toBe(false);
    expect(result.issues).toContain("All organization units must belong to the selected organization.");
    expect(result.issues).toContain("The branch or centre does not belong to the selected district.");
  });

  it("resolves one primary and multiple active employee assignments", () => {
    const scopes = resolveEmployeeOrganizationScopes({
      employeeId: "employee-1",
      userId: "user-1",
      institutionId: "org-1",
      divisionId: "division-1",
      districtId: "district-1",
      campusId: "campus-1",
      departmentId: "admissions",
      assignments: [
        { id: "assignment-1", institutionId: "org-1", divisionId: "division-2", departmentId: "technology", startsAt: new Date("2026-01-01") },
        { id: "assignment-expired", institutionId: "org-1", divisionId: "division-3", startsAt: new Date("2025-01-01"), endsAt: new Date("2025-12-31") }
      ]
    }, new Date("2026-09-27"));

    expect(scopes).toHaveLength(2);
    expect(scopes.map((scope) => scope.source)).toEqual(["PRIMARY", "ADDITIONAL"]);
    expect(scopes[1]).toMatchObject({ divisionId: "division-2", departmentId: "technology" });
  });

  it("uses an active secondary employee assignment for permission scope fallback", () => {
    const user: AuthorizationUser = {
      id: "user-1",
      roles: [{ role: { name: "HOD" } }],
      employeeProfile: {
        institutionId: "org-1",
        organizationAssignments: [
          { institutionId: "org-2", startsAt: new Date("2026-01-01"), endsAt: null }
        ]
      }
    };
    expect(resolveAuthorizedScopes(user, PERMISSIONS.RECRUITMENT_ACCESS, new Date("2026-09-27")).assignments).toEqual([
      expect.objectContaining({ scope: "ORGANIZATION", institutionId: "org-1" }),
      expect.objectContaining({ scope: "ORGANIZATION", institutionId: "org-2" })
    ]);
  });

  it("keeps one user account mapped to one employee profile", () => {
    const schema = readFileSync(new URL("../../prisma/schema.prisma", import.meta.url), "utf8");
    const employeeModel = schema.match(/model Employee \{[\s\S]*?\n\}/)?.[0] ?? "";
    expect(employeeModel).toContain("userId");
    expect(employeeModel).toMatch(/userId\s+String\s+@unique/);
    expect(schema).toContain("model EmployeeOrganizationAssignment");
    expect(employeeModel).toContain("organizationAssignments");
  });
});
