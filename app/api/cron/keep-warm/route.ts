// app/api/cron/keep-warm/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/config/prisma";

// export const runtime = "nodejs";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // lightweight query — just enough to keep the connection alive
  await prisma.$queryRaw`SELECT 1`;
  return NextResponse.json({ ok: true, ts: new Date().toISOString() });
}
