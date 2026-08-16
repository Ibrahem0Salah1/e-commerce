//api/s3/delete/route.ts
import { NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/authz";
import { r2, R2_BUCKET, getPublicUrl } from "@/lib/config/r2";
import prisma from "@/lib/config/prisma";

const deleteSchema = z.object({
  key: z.string().min(1),
});

export async function DELETE(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parsed = deleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }

    const { key } = parsed.data;

    // Security: ensure key starts with products/ (prevent deleting other buckets/paths)
    if (!key.startsWith("products/")) {
      return NextResponse.json({ error: "Invalid key path" }, { status: 400 });
    }

    // Check if any product, category or brand still references this image URL
    const publicUrl = getPublicUrl(key);
    const [productCount, categoryCount, brandCount] = await Promise.all([
      prisma.product.count({
        where: {
          images: {
            has: publicUrl,
          },
        },
      }),
      prisma.category.count({ where: { image: publicUrl } }),
      prisma.brand.count({ where: { logo: publicUrl } }),
    ]);

    if (productCount > 0 || categoryCount > 0 || brandCount > 0) {
      console.log(
        `[R2 Delete] Key ${key} is referenced by ${productCount} product(s), ${categoryCount} category(ies), ${brandCount} brand(s). Skipping R2 file deletion.`,
      );
      return NextResponse.json({ success: true, skipped: true });
    }

    await r2.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      })
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[R2 Delete]", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}