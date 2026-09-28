import { describe, expect, it, vi } from "vitest";
import { recordDomainEvent } from "@/server/communications/outbox";

describe("domain event outbox", () => {
  it("records events through an idempotent upsert inside the caller transaction", async () => {
    const upsert = vi.fn().mockResolvedValue({ id: "event-1" });
    const tx = { domainEvent: { upsert } };
    await recordDomainEvent(tx as never, { type: "payment.confirmed", idempotencyKey: "payment.confirmed:1", aggregateType: "PaymentTransaction", aggregateId: "payment-1", institutionId: "org-1", payload: { recipientUserId: "student-1" } });
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { idempotencyKey: "payment.confirmed:1" }, update: {}, create: expect.objectContaining({ type: "payment.confirmed", institutionId: "org-1" }) }));
  });
});
