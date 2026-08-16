    // app/api/debug/r2/route.ts
import { r2, R2_BUCKET } from "@/lib/config/r2";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await r2.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        MaxKeys: 1,
      })
    );
    console.log('ok')
    return NextResponse.json({
      status: "ok",
      bucket: R2_BUCKET,
      objectsFound: result.KeyCount || 0,
      message: "R2 connection successful",
    });
  } catch (err) {
    console.error("[R2 Debug]", err);
    return NextResponse.json(
      { 
        status: "error", 
        message: err instanceof Error ? err.message : "Unknown",
        code: (err as any)?.Code || "NO_CODE"
      },
      { status: 500 }
    );
  }
}