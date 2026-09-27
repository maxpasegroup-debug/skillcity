import { describe, expect, it } from "vitest";
import { createOtp, createToken, hashToken } from "@/lib/security/token";

describe("security tokens", () => {
  it("creates URL-safe tokens with fresh entropy", () => {
    const first = createToken(24);
    const second = createToken(24);

    expect(first).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(first).not.toBe(second);
  });

  it("hashes tokens deterministically without retaining the source token", () => {
    const token = "temporary-session-token";
    const hash = hashToken(token);

    expect(hash).toHaveLength(64);
    expect(hash).toBe(hashToken(token));
    expect(hash).not.toContain(token);
  });

  it("creates six-digit OTP values", () => {
    expect(createOtp()).toMatch(/^\d{6}$/);
  });
});
