// lib/ratelimit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/config/redis";

// ── Layer 1: Per-User (strict, lower limit) ──
export const userRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"), // 30 requests/min per user
  analytics: true,
  prefix: "ratelimit:user",
});

// ── Layer 2: Per-IP (guests, bots, fallback) ──
export const ipRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"), // 60 requests/min per IP
  analytics: true,
  prefix: "ratelimit:ip",
});

// ── Specialized: Cart mutations (prevent spam) ──
export const cartRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 cart ops/min
  analytics: true,
  prefix: "ratelimit:cart",
});

// ── Specialized: Admin mutations (prevent brute force) ──
export const adminRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"), // 20 admin ops/min
  analytics: true,
  prefix: "ratelimit:admin",
});

// ── Specialized: Checkout (prevent double-submit) ──
export const checkoutRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "5 m"), // 5 checkouts per 5 min
  analytics: true,
  prefix: "ratelimit:checkout",
});

// ── Helper: Extract IP from request headers ──
export async function getClientIP(): Promise<string> {
  const { headers } = await import("next/headers");
  const h = await headers();
  
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  
  const realIP = h.get("x-real-ip");
  if (realIP) return realIP;
  
  return "unknown";
}