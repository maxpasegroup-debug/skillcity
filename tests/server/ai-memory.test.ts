import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findFirst: vi.fn(), create: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { aIConversation: { findFirst: mocks.findFirst, create: mocks.create } } }));
import { getOrCreateConversation } from "@/server/ai/memory";

const context = { user: { id: "user-1", name: "User", roles: [] }, scope: "STUDENT" as const, completedActivities: [], pendingActivities: [], reflections: [], submissions: [], assessments: [], announcements: [], calendarEvents: [] };

describe("AI conversation isolation", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.findFirst.mockResolvedValue(null); mocks.create.mockResolvedValue({ id: "new-conversation" }); });
  it("requires an existing conversation to match user and requested scope", async () => {
    await getOrCreateConversation({ conversationId: "crafted", userId: "user-1", scope: "STUDENT", context });
    expect(mocks.findFirst).toHaveBeenCalledWith({ where: { id: "crafted", userId: "user-1", scope: "STUDENT", archivedAt: null } });
  });
});
