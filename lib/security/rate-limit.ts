import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/security/token";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
};

export interface RateLimitStore {
  consume(keyHash: string, limit: number, windowMs: number, now: Date): Promise<RateLimitResult>;
}

type MemoryEntry = { count: number; expiresAt: Date };

export class MemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, MemoryEntry>();

  async consume(keyHash: string, limit: number, windowMs: number, now: Date): Promise<RateLimitResult> {
    const current = this.buckets.get(keyHash);
    if (!current || current.expiresAt <= now) {
      const expiresAt = new Date(now.getTime() + windowMs);
      this.buckets.set(keyHash, { count: 1, expiresAt });
      return { allowed: true, remaining: Math.max(0, limit - 1), resetAt: expiresAt };
    }

    current.count += 1;
    return { allowed: current.count <= limit, remaining: Math.max(0, limit - current.count), resetAt: current.expiresAt };
  }
}

export class PrismaRateLimitStore implements RateLimitStore {
  async consume(keyHash: string, limit: number, windowMs: number, now: Date): Promise<RateLimitResult> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await prisma.$transaction(async (tx) => {
          const current = await tx.rateLimitBucket.findUnique({ where: { keyHash } });
          const expired = !current || current.expiresAt <= now;
          const expiresAt = expired ? new Date(now.getTime() + windowMs) : current.expiresAt;
          const count = expired ? 1 : current.count + 1;

          await tx.rateLimitBucket.upsert({
            where: { keyHash },
            create: { keyHash, count, windowStartedAt: now, expiresAt },
            update: expired ? { count, windowStartedAt: now, expiresAt } : { count }
          });

          return { allowed: count <= limit, remaining: Math.max(0, limit - count), resetAt: expiresAt };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (error) {
        const retryable = error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2034" || error.code === "P2002");
        if (!retryable || attempt === 2) throw error;
      }
    }

    throw new Error("Rate limit transaction retry exhausted");
  }
}

const developmentStore = new MemoryRateLimitStore();
const productionStore = new PrismaRateLimitStore();

export async function checkRateLimit(key: string, limit = 5, windowMs = 60_000, store?: RateLimitStore): Promise<RateLimitResult> {
  const selectedStore = store ?? (process.env.NODE_ENV === "production" ? productionStore : developmentStore);
  try {
    return await selectedStore.consume(hashToken(key), limit, windowMs, new Date());
  } catch (error) {
    console.error("Rate limit store unavailable", { message: error instanceof Error ? error.message : "Unknown error" });
    return { allowed: false, remaining: 0, resetAt: new Date(Date.now() + windowMs) };
  }
}
