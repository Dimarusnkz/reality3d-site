import { getPrisma } from './prisma';

type Bucket = { count: number; resetAt: number };

const globalForRateLimit = globalThis as unknown as {
  __rateLimit?: Map<string, Bucket>;
  __rateLimitLastSweepAt?: number;
};

const store = globalForRateLimit.__rateLimit || new Map<string, Bucket>();
globalForRateLimit.__rateLimit = store;

/**
 * Distributed rate limiter using Prisma (fallback to memory if Prisma fails).
 */
export async function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();

  try {
    const prisma = getPrisma();
    // Use transaction for atomic increment
    const result = await prisma.$transaction(async (tx) => {
      // 1. Clean up old entries (once in a while or per request)
      // For simplicity, we just look for our specific key
      const existing = await (tx as any).rateLimit.findUnique({ where: { key } });

      if (!existing || existing.resetAt.getTime() <= now) {
        const resetAt = new Date(now + windowMs);
        await (tx as any).rateLimit.upsert({
          where: { key },
          create: { key, count: 1, resetAt },
          update: { count: 1, resetAt },
        });
        return { ok: true as const, remaining: limit - 1, resetAt: resetAt.getTime() };
      }

      if (existing.count >= limit) {
        return { ok: false as const, remaining: 0, resetAt: existing.resetAt.getTime() };
      }

      const updated = await (tx as any).rateLimit.update({
        where: { key },
        data: { count: { increment: 1 } },
      });

      return { ok: true as const, remaining: limit - updated.count, resetAt: updated.resetAt.getTime() };
    });

    return result;
  } catch (e) {
    // Fallback to memory-based rate limiting if DB fails or table not migrated yet
    return memoryRateLimit(key, limit, windowMs);
  }
}

function memoryRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();

  const lastSweep = globalForRateLimit.__rateLimitLastSweepAt || 0;
  if (now - lastSweep > 60_000) {
    globalForRateLimit.__rateLimitLastSweepAt = now;
    for (const [k, v] of store.entries()) {
      if (v.resetAt <= now) {
        store.delete(k);
      }
    }
  }

  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true as const, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (existing.count >= limit) {
    return { ok: false as const, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  store.set(key, existing);
  return { ok: true as const, remaining: limit - existing.count, resetAt: existing.resetAt };
}

