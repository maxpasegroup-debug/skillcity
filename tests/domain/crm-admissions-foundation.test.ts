import { describe, expect, it } from "vitest";
import { funnelRate, normalizeCrmEmail, normalizeCrmPhone, organizationConflict, validateAdmissionRelationships } from "@/lib/crm/validation";

const application = { leadId: "lead-1", programId: "program-1", studentId: null };

describe("CRM and admissions foundation", () => {
  it("normalizes contact identifiers for conservative duplicate matching", () => {
    expect(normalizeCrmPhone("+91 98765-43210")).toBe("+919876543210");
    expect(normalizeCrmEmail("  Person@Example.COM ")).toBe("person@example.com");
  });

  it("does not invent an email when none is provided", () => {
    expect(normalizeCrmEmail(" ")).toBeNull();
  });

  it("detects explicit organization conflicts", () => {
    expect(organizationConflict({ institutionId: "one" }, { institutionId: "two" })).toBe("institutionId");
  });

  it("permits relationships when one side has legacy unscoped data", () => {
    expect(organizationConflict({ institutionId: null }, { institutionId: "one" })).toBeNull();
  });

  it("rejects an invoice from another lead or program", () => {
    expect(validateAdmissionRelationships({ application, invoice: { leadId: "lead-2", programId: "program-2", status: "PAID" }, journeyId: "journey-1" })).toEqual([
      "Invoice belongs to a different lead.",
      "Invoice belongs to a different program."
    ]);
  });

  it("requires verified payment", () => {
    expect(validateAdmissionRelationships({ application, invoice: { leadId: "lead-1", programId: "program-1", status: "ISSUED" }, journeyId: "journey-1" })).toContain("Invoice payment is not verified.");
  });

  it("rejects invalid batch relationships and full batches", () => {
    const issues = validateAdmissionRelationships({
      application,
      batch: { programId: "program-2", journeyId: "journey-2", status: "ARCHIVED", capacity: 20, enrollmentCount: 20 },
      journeyId: "journey-1"
    });
    expect(issues).toEqual([
      "Batch belongs to a different program.",
      "Batch is not active.",
      "Batch uses a different learning journey.",
      "Batch capacity has been reached."
    ]);
  });

  it("accepts a valid admission relationship", () => {
    expect(validateAdmissionRelationships({
      application,
      invoice: { leadId: "lead-1", programId: "program-1", status: "PAID" },
      batch: { programId: "program-1", journeyId: "journey-1", status: "ACTIVE", capacity: 20, enrollmentCount: 19 },
      journeyId: "journey-1"
    })).toEqual([]);
  });

  it("calculates stable funnel rates without dividing by zero", () => {
    expect(funnelRate(3, 10)).toBe(30);
    expect(funnelRate(1, 0)).toBe(0);
  });
});
