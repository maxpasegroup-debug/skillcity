import { describe, expect, it } from "vitest";
import { checkRateLimit, MemoryRateLimitStore, type RateLimitStore } from "@/lib/security/rate-limit";

describe("rate limiting", () => {
  it("enforces a limit through an injectable shared-store contract", async () => {
    const store = new MemoryRateLimitStore();
    expect((await checkRateLimit("person@example.com", 2, 60_000, store)).allowed).toBe(true);
    expect((await checkRateLimit("person@example.com", 2, 60_000, store)).allowed).toBe(true);
    expect((await checkRateLimit("person@example.com", 2, 60_000, store)).allowed).toBe(false);
  });

  it("fails closed when the backing store is unavailable", async () => {
    const store: RateLimitStore = { consume: async () => { throw new Error("database unavailable"); } };
    expect((await checkRateLimit("login:user", 5, 60_000, store)).allowed).toBe(false);
  });
});
