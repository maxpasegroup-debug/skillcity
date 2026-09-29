import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthorizationError } from "@/server/auth/authorization";

const mocks = vi.hoisted(() => ({ progress: vi.fn(), profile: vi.fn(), lead: vi.fn(), audit: vi.fn() }));
vi.mock("@/server/ai/tool-services", () => ({ getOwnAcademicProgress: mocks.progress, getOwnCareerProfile: mocks.profile, getScopedLeadSummary: mocks.lead }));
vi.mock("@/lib/prisma", () => ({ prisma: { platformAudit: { create: mocks.audit } } }));

import { executeAIReadTool, validateAIWriteProposal } from "@/server/ai/tools";

const assistant = { id: "assistant-1", status: "ACTIVE" as const, allowedTools: ["academic.get-own-progress", "crm.get-lead-summary", "communications.propose-notification"] };
const student = { id: "student-1", roles: [{ role: { name: "Student" } }] };

describe("controlled AI tools", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.audit.mockResolvedValue({}); });

  it("executes an allowed own-data tool and records a metadata-only audit", async () => {
    mocks.progress.mockResolvedValue({ currentDay: 2 });
    await expect(executeAIReadTool({ actor: student, assistant, code: "academic.get-own-progress", payload: {} })).resolves.toEqual({ currentDay: 2 });
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "AI_READ_TOOL_EXECUTED", metadata: { toolCode: "academic.get-own-progress" } }) }));
  });

  it("blocks tools outside the assistant allowlist", async () => {
    await expect(executeAIReadTool({ actor: student, assistant: { ...assistant, allowedTools: [] }, code: "academic.get-own-progress", payload: {} })).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("blocks a CRM tool when the actor lacks its permission", async () => {
    await expect(executeAIReadTool({ actor: student, assistant, code: "crm.get-lead-summary", payload: { leadId: "00000000-0000-4000-8000-000000000001" } })).rejects.toThrow("permission denied");
    expect(mocks.lead).not.toHaveBeenCalled();
  });

  it("delegates scoped resource denial to the domain service", async () => {
    const admission = { id: "admission-1", roles: [{ role: { name: "Admission" } }] };
    mocks.lead.mockRejectedValue(new AuthorizationError("outside organization scope"));
    await expect(executeAIReadTool({ actor: admission, assistant, code: "crm.get-lead-summary", payload: { leadId: "00000000-0000-4000-8000-000000000001" } })).rejects.toThrow("outside organization scope");
  });

  it("never executes a write tool directly and validates proposal input", async () => {
    const communicator = { id: "manager-1", roles: [{ role: { name: "Communications Manager" } }] };
    expect(validateAIWriteProposal({ actor: communicator, assistant, code: "communications.propose-notification", payload: { recipientUserId: "00000000-0000-4000-8000-000000000001", message: "Review this update" } })).toMatchObject({ message: "Review this update" });
    await expect(executeAIReadTool({ actor: communicator, assistant, code: "communications.propose-notification" as never, payload: {} })).rejects.toThrow("not available for direct execution");
  });
});
