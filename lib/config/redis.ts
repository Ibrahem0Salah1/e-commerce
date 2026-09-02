// lib/config/redis.ts — lazy, never throws at import.
// If UPSTASH env is missing, caching becomes a no-op so pages still SSR/build in preview envs.
import { Redis } from "@upstash/redis";

const hasRedisEnv =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!hasRedisEnv) return null;
  if (_redis) return _redis;
  _redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  return _redis;
}

export const redis: Redis = new Proxy({} as unknown as Redis, {
  get(_target, prop) {
    const r = getRedis();
    if (!r) throw new Error("Redis not configured — missing UPSTASH_REDIS_REST_URL/TOKEN");
    const v = (r as unknown as Record<string, unknown>)[prop as string];
    return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(r) : v;
  },
}) as Redis;

export { hasRedisEnv, getRedis };

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 3600,
): Promise<T> {
  const r = getRedis();
  if (!r) return fetcher(); // no cache available — direct fetch
  try {
    const cached = await r.get<T>(key);
    if (cached !== null && cached !== undefined) {
      if (process.env.NODE_ENV !== "production") console.log(`[Cache HIT] ${key}`);
      return cached;
    }
  } catch (err) {
    console.error(`[Cache ERROR] ${key}:`, err);
  }

  if (process.env.NODE_ENV !== "production") console.log(`[Cache MISS] ${key}`);
  const data = await fetcher();

  try {
    await r.setex(key, ttlSeconds, data);
    if (process.env.NODE_ENV !== "production") console.log(`[Cache SET] ${key} (TTL: ${ttlSeconds}s)`);
  } catch (err) {
    console.error(`[Cache SET ERROR] ${key}:`, err);
  }

  return data;
}

export async function setCache<T>(
  key: string,
  data: T,
  ttlSeconds: number = 3600,
): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.setex(key, ttlSeconds, data);
    if (process.env.NODE_ENV !== "production") console.log(`[Cache SET] ${key} (TTL: ${ttlSeconds}s)`);
  } catch (err) {
    console.error(`[Cache SET ERROR] ${key}:`, err);
  }
}

export async function invalidateCache(key: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.del(key);
    if (process.env.NODE_ENV !== "production") console.log(`[Cache INVALIDATED] ${key}`);
  } catch (err) {
    console.error(`[Cache INVALIDATE ERROR] ${key}:`, err);
  }
}

export async function invalidatePattern(pattern: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    let cursor = "0";
    const keysToDelete: string[] = [];

    do {
      const [nextCursor, keys] = await r.scan(cursor, {
        match: pattern,
        count: 100,
      });
      cursor = nextCursor;
      keysToDelete.push(...keys);
    } while (cursor !== "0");

    if (keysToDelete.length > 0) {
      await r.del(...keysToDelete);
      if (process.env.NODE_ENV !== "production")
        console.log(`[Cache INVALIDATED PATTERN] ${pattern} (${keysToDelete.length} keys)`);
    } else if (process.env.NODE_ENV !== "production") {
      console.log(`[Cache INVALIDATED PATTERN] ${pattern} (0 keys)`);
    }
  } catch (err) {
    console.error(`[Cache INVALIDATE PATTERN ERROR] ${pattern}:`, err);
  }
}
