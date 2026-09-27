import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/security/password";

describe("password security", () => {
  it("hashes a password and verifies only the matching value", async () => {
    const hash = await hashPassword("a-strong-test-password");

    expect(hash).not.toContain("a-strong-test-password");
    await expect(verifyPassword("a-strong-test-password", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });
});
