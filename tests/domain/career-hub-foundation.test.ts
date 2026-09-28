import { describe, expect, it } from "vitest";
import { careerEmployerSchema, careerOpportunitySchema, careerTalentProfileSchema } from "@/features/career-hub/schemas";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { assignmentCoversCareerResource, canTransitionCareerApplication, CAREER_OPPORTUNITY_TYPES, normalizeOpportunityCode, opportunityAcceptsApplications } from "@/lib/career-hub/career";
import { careerEmployerScopeWhere, careerOpportunityApplicationScopeWhere, careerOpportunityScopeWhere } from "@/server/auth/scoping";
import { careerCandidatePresentationSelect } from "@/server/career-hub/queries";

const id = (suffix: string) => `00000000-0000-4000-8000-0000000000${suffix}`;
const role = (name: string) => [{ role: { name } }];

describe("AIRA Career Hub foundation", () => {
  it("uses a focused opportunity type catalog including self-employment", () => {
    expect(CAREER_OPPORTUNITY_TYPES).toEqual(["EMPLOYMENT", "FREELANCE", "CONTRACT", "INTERNSHIP", "APPRENTICESHIP", "PROJECT", "SELF_EMPLOYMENT"]);
  });

  it("normalizes stable opportunity identifiers", () => {
    expect(normalizeOpportunityCode("  frontend-intern-2026  ")).toBe("frontend-intern-2026");
  });

  it("validates an employer as a scoped external partner", () => {
    expect(careerEmployerSchema.safeParse({ code: "acme", name: "Acme", publicDescription: "Verified technology opportunity partner.", institutionId: id("01") }).success).toBe(true);
  });

  it("validates opportunity ownership and organization", () => {
    const result = careerOpportunitySchema.safeParse({ employerId: id("01"), ownerEmployeeId: id("02"), code: "frontend-intern", title: "Frontend Intern", publicDescription: "Build and ship supervised production user interfaces.", type: "INTERNSHIP", workMode: "HYBRID", status: "DRAFT", visibility: "INTERNAL", institutionId: id("03") });
    expect(result.success).toBe(true);
  });

  it("defaults talent privacy through explicit application-only input", () => {
    const result = careerTalentProfileSchema.safeParse({ availability: "OPEN_TO_OPPORTUNITIES", visibility: "APPLICATION_ONLY" });
    expect(result.success).toBe(true);
    expect(careerTalentProfileSchema.safeParse({ availability: "OPEN_TO_OPPORTUNITIES", visibility: "PUBLIC" }).success).toBe(false);
  });

  it("requires compatible Employee organization placement", () => {
    const resource = { institutionId: "org-1", divisionId: "career", campusId: "centre-1" };
    expect(assignmentCoversCareerResource({ institutionId: "org-1", divisionId: "career" }, resource)).toBe(true);
    expect(assignmentCoversCareerResource({ institutionId: "org-2" }, resource)).toBe(false);
    expect(assignmentCoversCareerResource({ institutionId: "org-1", divisionId: "labs" }, resource)).toBe(false);
  });

  it("enforces controlled application transitions", () => {
    expect(canTransitionCareerApplication("SUBMITTED", "SHORTLISTED")).toBe(true);
    expect(canTransitionCareerApplication("REJECTED", "SELECTED")).toBe(false);
    expect(canTransitionCareerApplication("WITHDRAWN", "UNDER_REVIEW")).toBe(false);
  });

  it("enforces open status, visibility, deadline, and capacity", () => {
    const now = new Date("2026-09-28T10:00:00Z");
    expect(opportunityAcceptsApplications({ status: "OPEN", visibility: "PUBLIC", activeApplications: 1, capacity: 2, applicationDeadline: new Date("2026-10-01") }, now)).toBe(true);
    expect(opportunityAcceptsApplications({ status: "OPEN", visibility: "INTERNAL", activeApplications: 0 }, now)).toBe(false);
    expect(opportunityAcceptsApplications({ status: "OPEN", visibility: "PUBLIC", activeApplications: 2, capacity: 2 }, now)).toBe(false);
  });

  it("gives students Career Hub access without a duplicate identity", () => {
    const student = { id: "student-1", roles: role("Student") };
    expect(hasPermission(student, PERMISSIONS.CAREER_READ)).toBe(true);
    expect(hasPermission(student, PERMISSIONS.CAREER_APPLY)).toBe(true);
  });

  it("does not grant Career Hub candidate data to trainers or advisors", () => {
    expect(hasPermission({ id: "trainer", roles: role("Trainer") }, PERMISSIONS.CAREER_APPLICATION_MANAGE)).toBe(false);
    expect(hasPermission({ id: "advisor", roles: role("Academic Advisor") }, PERMISSIONS.CAREER_APPLICATION_MANAGE)).toBe(false);
  });

  it("scopes employers and opportunities to organization assignments", () => {
    const manager = { id: "manager", roles: role("Career Hub Manager"), employeeProfile: { institutionId: "org-1" } };
    expect(JSON.stringify(careerEmployerScopeWhere(manager, PERMISSIONS.CAREER_OPPORTUNITY_MANAGE))).toContain("org-1");
    expect(JSON.stringify(careerOpportunityScopeWhere(manager, PERMISSIONS.CAREER_OPPORTUNITY_MANAGE))).toContain("org-1");
  });

  it("limits opportunity owners to their own Employee-owned records", () => {
    const owner = { id: "owner-user", roles: role("Opportunity Owner") };
    const predicate = JSON.stringify(careerOpportunityScopeWhere(owner, PERMISSIONS.CAREER_OPPORTUNITY_MANAGE));
    expect(predicate).toContain("owner-user");
    expect(predicate).toContain("ownerEmployee");
  });

  it("limits participants to their own applications", () => {
    const participant = { id: "participant-1", roles: role("Career Participant") };
    const predicate = JSON.stringify(careerOpportunityApplicationScopeWhere(participant, PERMISSIONS.CAREER_APPLY));
    expect(predicate).toContain("participant-1");
    expect(predicate).not.toContain("email");
  });

  it("uses an explicit candidate presentation without private identity fields", () => {
    const keys = Object.keys(careerCandidatePresentationSelect);
    expect(keys).toEqual(["id", "name", "careerTalentProfile", "verifiedSkills"]);
    expect(keys).not.toContain("email");
    expect(keys).not.toContain("studentDocuments");
    expect(keys).not.toContain("leadNotes");
    expect(keys).not.toContain("feeInvoices");
  });
});
