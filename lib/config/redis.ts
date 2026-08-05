// lib/redis.ts

import { Redis } from "@upstash/redis";

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error("Missing Upstash Redis environment variables");
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 3600,
): Promise<T> {
  try {
    const cached = await redis.get<T>(key);
    if (cached !== null && cached !== undefined) {
      console.log(`[Cache HIT] ${key}`);
      return cached;
    }
  } catch (err) {
    console.error(`[Cache ERROR] ${key}:`, err);
  }

  console.log(`[Cache MISS] ${key}`);
  const data = await fetcher();

  try {
    await redis.setex(key, ttlSeconds, data);
    console.log(`[Cache SET] ${key} (TTL: ${ttlSeconds}s)`);
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
  try {
    await redis.setex(key, ttlSeconds, data);
    console.log(`[Cache SET] ${key} (TTL: ${ttlSeconds}s)`);
  } catch (err) {
    console.error(`[Cache SET ERROR] ${key}:`, err);
  }
}

export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key);
    console.log(`[Cache INVALIDATED] ${key}`);
  } catch (err) {
    console.error(`[Cache INVALIDATE ERROR] ${key}:`, err);
  }
}

export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    let cursor = "0";
    const keysToDelete: string[] = [];

    do {
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: pattern,
        count: 100,
      });
      cursor = nextCursor;
      keysToDelete.push(...keys);
    } while (cursor !== "0");

    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete);
      console.log(`[Cache INVALIDATED PATTERN] ${pattern} (${keysToDelete.length} keys)`);
    } else {
      console.log(`[Cache INVALIDATED PATTERN] ${pattern} (0 keys)`);
    }
  } catch (err) {
    console.error(`[Cache INVALIDATE PATTERN ERROR] ${pattern}:`, err);
  }
}