import { describe, expect, it, vi } from "vitest";
import { AuthorizationError } from "@/server/auth/authorization";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
import { buildTaraContext } from "@/server/ai/context";

describe("AI context authorization", () => {
  it("denies context construction before database access when the scope permission is absent", async () => {
    const actor = { id: "student-1", roles: [{ role: { name: "Student" } }] };
    await expect(buildTaraContext(actor, "DIRECTOR")).rejects.toBeInstanceOf(AuthorizationError);
  });
});
