// app/api/debug/redis/route.ts
import { redis } from "@/lib/config/redis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const ping = await redis.ping();
    return NextResponse.json({ status: "ok", ping });
  } catch (err) {
    return NextResponse.json(
      { status: "error", message: err instanceof Error ? err.message : "Unknown" },
      { status: 500 }
    );
  }
}