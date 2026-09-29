import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertPermission: vi.fn(),
  membershipFind: vi.fn(),
  messageCreate: vi.fn(),
  notificationCreateMany: vi.fn(),
  auditCreate: vi.fn(),
  transaction: vi.fn()
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth/authorization", () => ({
  AuthorizationError: class AuthorizationError extends Error {},
  assertPermission: mocks.assertPermission
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    internalChannelMember: { findFirst: mocks.membershipFind },
    internalMessage: { create: mocks.messageCreate },
    notification: { createMany: mocks.notificationCreateMany },
    platformAudit: { create: mocks.auditCreate },
    $transaction: mocks.transaction
  }
}));
vi.mock("@/server/organization/service", () => ({ validateOrganizationPathForActor: vi.fn() }));
vi.mock("@/server/communications/automation", () => ({ processDomainEvent: vi.fn() }));

import { sendInternalMessageAction } from "@/actions/communications";

function form() {
  const value = new FormData();
  value.set("channelId", "10000000-0000-4000-8000-000000000001");
  value.set("body", "Operational update");
  return value;
}

const activeActor = {
  id: "20000000-0000-4000-8000-000000000001",
  roles: [],
  employeeProfile: { id: "30000000-0000-4000-8000-000000000001", status: "ACTIVE" }
};

describe("V2 internal communication actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.assertPermission.mockResolvedValue(activeActor);
    mocks.messageCreate.mockResolvedValue({ id: "message-1" });
    mocks.transaction.mockImplementation(async (operation: unknown) => typeof operation === "function" ? operation({ internalMessage: { create: mocks.messageCreate }, notification: { createMany: mocks.notificationCreateMany }, platformAudit: { create: mocks.auditCreate } }) : operation);
  });

  it("denies a crafted channel ID when the actor is not an active member", async () => {
    mocks.membershipFind.mockResolvedValue(null);
    await expect(sendInternalMessageAction({ ok: false, message: "" }, form())).rejects.toThrow("Channel membership required");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("prevents ordinary members from publishing authority announcements", async () => {
    mocks.membershipFind.mockResolvedValue({ channelId: "channel-1", role: "MEMBER", channel: { id: "channel-1", type: "ANNOUNCEMENT", name: "Authority", members: [] } });
    await expect(sendInternalMessageAction({ ok: false, message: "" }, form())).rejects.toThrow("Only channel owners and moderators");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects an exited employee even when role permission remains", async () => {
    mocks.assertPermission.mockResolvedValue({ ...activeActor, employeeProfile: { ...activeActor.employeeProfile, status: "EXITED" } });
    await expect(sendInternalMessageAction({ ok: false, message: "" }, form())).rejects.toThrow("Active Employee profile required");
    expect(mocks.membershipFind).not.toHaveBeenCalled();
  });

  it("persists a valid team message and member notifications atomically", async () => {
    mocks.membershipFind.mockResolvedValue({ channelId: "channel-1", role: "MEMBER", channel: { id: "channel-1", type: "TEAM", name: "Academic Team", members: [{ userId: "recipient-1" }] } });
    await expect(sendInternalMessageAction({ ok: false, message: "" }, form())).resolves.toEqual({ ok: true, message: "Message sent." });
    expect(mocks.messageCreate).toHaveBeenCalled();
    expect(mocks.notificationCreateMany).toHaveBeenCalledWith({ data: [expect.objectContaining({ userId: "recipient-1", actionUrl: "/communications/channels/channel-1" })] });
    expect(mocks.auditCreate).toHaveBeenCalled();
  });
});
