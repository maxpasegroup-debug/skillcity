import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { communicationTemplateSchema, eventAutomationSchema } from "@/features/communications/schemas";
import { canApplyDeliveryStatus, DOMAIN_EVENT_TYPES, maskRecipient, renderCommunicationTemplate, retryDelay, templateVariables, verifyWebhookSignature } from "@/lib/communications/policies";
import { hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { communicationMessageScopeWhere, domainEventScopeWhere } from "@/server/auth/scoping";

const organizationId = "00000000-0000-4000-8000-000000000001";
const role = (name: string) => [{ role: { name } }];

describe("communications and automation foundation", () => {
  it("exposes only the first controlled business events", () => {
    expect(DOMAIN_EVENT_TYPES).toEqual(["lead.created", "career.application.submitted", "payment.confirmed"]);
  });

  it("extracts unique template variables", () => {
    expect(templateVariables("Hello {{ name }}, ref {{reference}} / {{name}}")).toEqual(["name", "reference"]);
  });

  it("renders templates without evaluating code", () => {
    expect(renderCommunicationTemplate("Hello {{name}}", { name: "Aira" })).toBe("Hello Aira");
    expect(() => renderCommunicationTemplate("Hello {{name}}", {})).toThrow("Missing template variables");
  });

  it("masks email and phone recipients", () => {
    expect(maskRecipient("person@example.com")).toBe("pe***@example.com");
    expect(maskRecipient("+919876543210")).toBe("***3210");
  });

  it("bounds exponential retry delay", () => {
    expect(retryDelay(1)).toBe(60_000);
    expect(retryDelay(20)).toBe(3_600_000);
  });

  it("verifies webhook signatures against the raw body", () => {
    const body = '{"id":"provider-1"}';
    const secret = "test-secret";
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyWebhookSignature(body, `sha256=${signature}`, secret)).toBe(true);
    expect(verifyWebhookSignature(`${body}x`, signature, secret)).toBe(false);
  });

  it("prevents delivery status regression and terminal rewrites", () => {
    expect(canApplyDeliveryStatus("SUBMITTED", "DELIVERED")).toBe(true);
    expect(canApplyDeliveryStatus("DELIVERED", "SENT")).toBe(false);
    expect(canApplyDeliveryStatus("FAILED", "QUEUED")).toBe(false);
  });

  it("rejects unsupported channels and arbitrary automation recipients", () => {
    const template = { institutionId: organizationId, code: "WELCOME", name: "Welcome", channel: "SMS", purpose: "OPERATIONAL", body: "Hi", locale: "en" };
    const automation = { institutionId: organizationId, code: "AUTO", name: "Auto", eventType: "lead.created", recipientPayloadKey: "email", title: "Title", message: "Message", maxAttempts: 3 };
    expect(communicationTemplateSchema.safeParse(template).success).toBe(false);
    expect(eventAutomationSchema.safeParse(automation).success).toBe(false);
  });

  it("accepts controlled in-app automation definitions", () => {
    expect(eventAutomationSchema.safeParse({ institutionId: organizationId, code: "AUTO", name: "Auto", eventType: "lead.created", recipientPayloadKey: "recipientUserId", title: "Title", message: "Message", maxAttempts: 3 }).success).toBe(true);
  });

  it("scopes messages and events to organization assignments", () => {
    const manager = { id: "manager-1", roles: role("Communications Manager"), employeeProfile: { institutionId: organizationId } };
    expect(JSON.stringify(communicationMessageScopeWhere(manager, PERMISSIONS.COMMUNICATIONS_READ))).toContain(organizationId);
    expect(JSON.stringify(domainEventScopeWhere(manager, PERMISSIONS.COMMUNICATIONS_READ))).toContain(organizationId);
  });

  it("allows recipients to access their own communication records", () => {
    const user = { id: "user-1", roles: [{ role: { name: "Custom", permissions: [{ scope: "OWN" as const, permission: { key: PERMISSIONS.COMMUNICATIONS_READ, active: true } }] } }] };
    expect(JSON.stringify(communicationMessageScopeWhere(user, PERMISSIONS.COMMUNICATIONS_READ))).toContain("user-1");
  });

  it("does not grant communications operations to unrelated roles", () => {
    for (const name of ["Student", "Trainer", "Career Participant"]) {
      const user = { id: name, roles: role(name) };
      expect(hasPermission(user, PERMISSIONS.COMMUNICATIONS_MANAGE)).toBe(false);
      expect(hasPermission(user, PERMISSIONS.AUTOMATIONS_MANAGE)).toBe(false);
    }
  });
});
