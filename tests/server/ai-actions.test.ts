import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentUser: vi.fn(), assistantFind: vi.fn(), proposalFind: vi.fn(), proposalCreate: vi.fn(), proposalUpdateMany: vi.fn(), auditCreate: vi.fn()
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth/session", () => ({ getCurrentUser: mocks.currentUser }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  aIAssistant: { findUnique: mocks.assistantFind },
  aIActionProposal: { findUnique: mocks.proposalFind, findUniqueOrThrow: mocks.proposalFind },
  platformAudit: { create: mocks.auditCreate },
  $transaction: vi.fn(async (input: unknown) => Array.isArray(input) ? Promise.all(input) : typeof input === "function" ? input({ aIActionProposal: { findUnique: mocks.proposalFind, create: mocks.proposalCreate, updateMany: mocks.proposalUpdateMany }, platformAudit: { create: mocks.auditCreate } }) : input)
} }));

import { approveAIActionProposalAction, createAIActionProposalAction } from "@/actions/ai";

const assistant = { id: "assistant-1", code: "tara", status: "ACTIVE" as const, allowedTools: ["communications.propose-notification"] };
const proposed = { id: "proposal-1", status: "PENDING_APPROVAL" as const, toolCode: "communications.propose-notification", organizationContext: { ownerId: "manager-1" } };

function proposalForm() {
  const form = new FormData();
  form.set("assistantCode", "tara"); form.set("toolCode", "communications.propose-notification"); form.set("reason", "Prepare a reviewed internal notification"); form.set("idempotencyKey", "request-1");
  form.set("input", JSON.stringify({ recipientUserId: "00000000-0000-4000-8000-000000000001", message: "Please review your task." }));
  return form;
}

describe("AI write proposal approvals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.currentUser.mockResolvedValue({ id: "manager-1", roles: [{ role: { name: "Communications Manager" } }], employeeProfile: { institutionId: "org-1" } });
    mocks.assistantFind.mockResolvedValue(assistant); mocks.proposalFind.mockResolvedValue(null); mocks.proposalCreate.mockResolvedValue(proposed); mocks.auditCreate.mockResolvedValue({ id: "audit-1" }); mocks.proposalUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("stores a write request as a pending proposal with an audit", async () => {
    const result = await createAIActionProposalAction({ ok: false, message: "" }, proposalForm());
    expect(result.ok).toBe(true);
    expect(mocks.proposalCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ toolCode: "communications.propose-notification" }) }));
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "AI_ACTION_PROPOSED" }) }));
  });

  it("is idempotent for repeated actor request keys", async () => {
    mocks.proposalFind.mockResolvedValue(proposed);
    await createAIActionProposalAction({ ok: false, message: "" }, proposalForm());
    expect(mocks.proposalCreate).not.toHaveBeenCalled();
  });

  it("requires human approval and records only the decision", async () => {
    mocks.currentUser.mockResolvedValue({ id: "director-1", roles: [{ role: { name: "Director" } }] });
    mocks.proposalFind.mockResolvedValue(proposed);
    const form = new FormData(); form.set("proposalId", "proposal-1"); form.set("reviewNote", "Approved for later controlled execution");
    const result = await approveAIActionProposalAction({ ok: false, message: "" }, form);
    expect(result.message).toContain("No business mutation was executed");
    expect(mocks.proposalUpdateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "APPROVED", reviewedById: "director-1" }) }));
  });
});
