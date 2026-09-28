import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  eventFind: vi.fn(), eventUpdate: vi.fn(), ruleFind: vi.fn(),
  executionUpsert: vi.fn(), executionUpdate: vi.fn(), messageUpsert: vi.fn(), notificationUpsert: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({ prisma: {
  domainEvent: { findUniqueOrThrow: mocks.eventFind, update: mocks.eventUpdate },
  automationRule: { findMany: mocks.ruleFind },
  automationExecution: { upsert: mocks.executionUpsert },
  $transaction: vi.fn(async (callback: (tx: unknown) => unknown) => callback({
    automationExecution: { upsert: mocks.executionUpsert, update: mocks.executionUpdate },
    communicationMessage: { upsert: mocks.messageUpsert },
    notification: { upsert: mocks.notificationUpsert }
  }))
} }));

import { processDomainEvent } from "@/server/communications/automation";

const event = { id: "event-1", type: "lead.created", idempotencyKey: "lead.created:1", aggregateType: "Lead", aggregateId: "lead-1", payload: { recipientUserId: "user-1" }, status: "PENDING", institutionId: "org-1", divisionId: null, districtId: null, campusId: null, departmentId: null, actorId: "actor-1", attempts: 0, maxAttempts: 3, availableAt: new Date(), processedAt: null, lastError: null, createdAt: new Date(), updatedAt: new Date() } as const;
const rule = { id: "rule-1", code: "RULE", name: "Rule", description: null, triggerType: "EVENT", eventType: "lead.created", actionType: "SEND_NOTIFICATION", conditions: {}, actionConfig: { recipientPayloadKey: "recipientUserId", title: "Assigned", message: "New lead" }, active: true, institutionId: "org-1", divisionId: null, districtId: null, campusId: null, departmentId: null, createdById: null, maxAttempts: 3, createdAt: new Date(), updatedAt: new Date() } as const;

describe("durable event automation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.eventFind.mockResolvedValue(event);
    mocks.eventUpdate.mockImplementation(async ({ data }) => ({ ...event, ...data }));
    mocks.ruleFind.mockResolvedValue([rule]);
    mocks.executionUpsert.mockResolvedValue({ id: "execution-1" });
    mocks.messageUpsert.mockResolvedValue({ id: "message-1" });
    mocks.notificationUpsert.mockResolvedValue({ id: "notification-1" });
    mocks.executionUpdate.mockResolvedValue({ id: "execution-1", status: "SUCCESS" });
  });

  it("creates one idempotent execution, message, and notification", async () => {
    await processDomainEvent(event.id);
    expect(mocks.executionUpsert).toHaveBeenCalledWith(expect.objectContaining({ where: { idempotencyKey: "event-1:rule-1" } }));
    expect(mocks.messageUpsert).toHaveBeenCalledWith(expect.objectContaining({ where: { idempotencyKey: "automation:event-1:rule-1" } }));
    expect(mocks.notificationUpsert).toHaveBeenCalled();
    expect(mocks.executionUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "SUCCESS" }) }));
  });

  it("marks an event processed when no rule matches", async () => {
    mocks.ruleFind.mockResolvedValue([]);
    await processDomainEvent(event.id);
    expect(mocks.notificationUpsert).not.toHaveBeenCalled();
    expect(mocks.eventUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "PROCESSED" }) }));
  });

  it("does not execute rules from another organization", async () => {
    mocks.ruleFind.mockResolvedValue([{ ...rule, institutionId: "org-2" }]);
    await processDomainEvent(event.id);
    expect(mocks.executionUpsert).not.toHaveBeenCalled();
  });

  it("persists a retryable failure for invalid action configuration", async () => {
    mocks.ruleFind.mockResolvedValue([{ ...rule, actionConfig: { recipientPayloadKey: "email" } }]);
    await expect(processDomainEvent(event.id)).rejects.toBeTruthy();
    expect(mocks.eventUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "FAILED" }) }));
  });

  it("dead-letters an exhausted event", async () => {
    mocks.eventFind.mockResolvedValue({ ...event, attempts: 2 });
    mocks.ruleFind.mockResolvedValue([{ ...rule, actionConfig: {} }]);
    await expect(processDomainEvent(event.id)).rejects.toBeTruthy();
    expect(mocks.eventUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "DEAD_LETTER" }) }));
  });

  it("does not replay a processed event", async () => {
    mocks.eventFind.mockResolvedValue({ ...event, status: "PROCESSED" });
    await processDomainEvent(event.id);
    expect(mocks.ruleFind).not.toHaveBeenCalled();
  });
});
