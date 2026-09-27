import { describe, expect, it } from "vitest";
import { PERMISSIONS, type AuthorizationUser } from "@/lib/auth/permissions";
import {
  applicationScopeWhere,
  batchScopeWhere,
  careerApplicationScopeWhere,
  documentScopeWhere,
  leadScopeWhere,
  programScopeWhere
} from "@/server/auth/scoping";

function scopedUser(scope: NonNullable<AuthorizationUser["accessScopes"]>[number]): AuthorizationUser {
  return {
    id: "user-1",
    roles: [{ role: { name: "Admin" } }],
    accessScopes: [scope]
  };
}

describe("organization query scoping", () => {
  it("returns an unrestricted predicate only for an unassigned global actor", () => {
    const admin: AuthorizationUser = { id: "admin-1", roles: [{ role: { name: "Admin" } }] };
    expect(leadScopeWhere(admin, PERMISSIONS.ADMISSIONS_ACCESS)).toEqual({});
  });

  it("constrains district leads and includes branches in that district", () => {
    const where = leadScopeWhere(scopedUser({ scope: "DISTRICT", districtId: "district-1" }), PERMISSIONS.ADMISSIONS_ACCESS);
    expect(where).toEqual({ OR: [{ OR: [{ districtId: "district-1" }, { campus: { districtId: "district-1" } }] }] });
    expect(JSON.stringify(where)).not.toContain("district-2");
  });

  it("constrains programs and recruitment records to a branch", () => {
    const actor = scopedUser({ scope: "BRANCH", campusId: "campus-1" });
    expect(programScopeWhere(actor, PERMISSIONS.ADMISSIONS_ACCESS)).toEqual({ OR: [{ campusId: "campus-1" }] });
    expect(careerApplicationScopeWhere(actor, PERMISSIONS.RECRUITMENT_ACCESS)).toEqual({ OR: [{ campusId: "campus-1" }] });
  });

  it("uses explicit batch campus first and program inheritance only when campus is absent", () => {
    const where = batchScopeWhere(scopedUser({ scope: "BRANCH", campusId: "campus-1" }), PERMISSIONS.DIRECTOR_ACCESS);
    expect(where).toEqual({
      OR: [{ OR: [{ campusId: "campus-1" }, { campusId: null, program: { campusId: "campus-1" } }] }]
    });
  });

  it("inherits application scope from lead and only falls back to program for unscoped legacy leads", () => {
    const where = applicationScopeWhere(scopedUser({ scope: "BRANCH", campusId: "campus-1" }), PERMISSIONS.ADMISSIONS_ACCESS);
    expect(where).toEqual({
      OR: [{
        OR: [
          { lead: { campusId: "campus-1" } },
          {
            lead: { institutionId: null, divisionId: null, districtId: null, campusId: null },
            program: { campusId: "campus-1" }
          }
        ]
      }]
    });
  });

  it("scopes documents through their application or student enrollment", () => {
    const where = documentScopeWhere(scopedUser({ scope: "BRANCH", campusId: "campus-1" }), PERMISSIONS.ADMISSIONS_ACCESS);
    const serialized = JSON.stringify(where);
    expect(serialized).toContain('"applicationId":{"not":null}');
    expect(serialized).toContain('"campusId":"campus-1"');
    expect(serialized).toContain('"enrollments":{"some"');
  });

  it("fails closed when a scoped grant has no usable assignment", () => {
    const user: AuthorizationUser = {
      id: "user-1",
      roles: [{ role: { name: "Admission" } }]
    };
    expect(leadScopeWhere(user, PERMISSIONS.ADMISSIONS_ACCESS)).toEqual({
      OR: [{ id: { equals: "00000000-0000-0000-0000-000000000000" } }]
    });
  });
});
