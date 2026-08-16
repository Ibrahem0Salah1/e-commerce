// app/api/s3/upload/route.ts
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/authz";
import { r2, R2_BUCKET, getPublicUrl } from "@/lib/config/r2";
import { ipRatelimit, userRatelimit, getClientIP } from "@/lib/ratelimit";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";

const uploadSchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().regex(/^image\/(jpeg|png|webp|gif|svg)$/, "Only images allowed"),
  size: z.number().max(10 * 1024 * 1024, "Max 10MB"),
  fileHash: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    // ── 1. Auth: Admin only ──
    await requireAdmin();

    // ── 2. Rate Limit Layer 1: Per-User (strict) ──
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;
    
    if (userId) {
      const { success: userOk, reset: userReset } = await userRatelimit.limit(`upload:${userId}`);
      if (!userOk) {
        const retryAfter = Math.ceil((userReset - Date.now()) / 1000);
        return NextResponse.json(
          { error: "Upload limit reached. Slow down." },
          { status: 429, headers: { "Retry-After": String(retryAfter) } }
        );
      }
    }

    // ── 4. Validate input ──
    const body = await request.json();
    const parsed = uploadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error},
        { status: 400 }
      );
    }

    const { filename, contentType, size, fileHash } = parsed.data;

    // ── 5. Key calculation (Hash or UUID fallback) ──
    const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
    const key = fileHash ? `products/${fileHash}.${ext}` : `products/${uuidv4()}.${ext}`;

    // ── 6. Check if file already exists in R2 Bucket ──
    if (fileHash) {
      try {
        await r2.send(
          new HeadObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
          })
        );

        // Object exists! Return existing public URL immediately (skip upload)
        return NextResponse.json({
          exists: true,
          key,
          publicUrl: getPublicUrl(key),
        });
      } catch (err: unknown) {
        // If object does not exist (404/NotFound), proceed to generate presigned URL
      }
    }

    // ── 7. File does not exist — Create presigned URL (valid 5 min) ──
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    });

    const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 300 });

    // ── 8. Return URLs to browser ──
    return NextResponse.json({
      exists: false,
      presignedUrl,
      key,
      publicUrl: getPublicUrl(key),
    });
  } catch (err) {
    console.error("[R2 Upload]", err);
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}