// app/api/debug/ratelimit/route.ts
import { ipRatelimit, userRatelimit } from "@/lib/ratelimit";
import { NextResponse } from "next/server";

export async function GET() {
  const testKey = `test:${Date.now()}`;
  
  const ipResult = await ipRatelimit.limit(testKey);
  const userResult = await userRatelimit.limit(testKey);
  
  return NextResponse.json({
    ip: {
      success: ipResult.success,
      remaining: ipResult.remaining,
      reset: new Date(ipResult.reset).toISOString(),
    },
    user: {
      success: userResult.success,
      remaining: userResult.remaining,
      reset: new Date(userResult.reset).toISOString(),
    },
  });
}