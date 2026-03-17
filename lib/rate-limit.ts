type Bucket = { count: number; resetAt: number };

const globalForRateLimit = globalThis as unknown as {
  __rateLimit?: Map<string, Bucket>;
  __rateLimitLastSweepAt?: number;
};

const store = globalForRateLimit.__rateLimit || new Map<string, Bucket>();
globalForRateLimit.__rateLimit = store;

export function rateLimit(key: string, limit: number, windowMs: number) {
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

