// ⚠️ TEMPORARILY DISABLED FOR MVP — stale-order cleanup cron.
// The original implementation is preserved (commented) below so it can be
// restored later. When re-enabling:
//   1. Set CRON_SECRET (fail-closed auth — see the guard in the old code).
//   2. Reuse the claim-first cancellation helper in lib/orders/cancellation.ts
//      (cancelOrderAndRestoreStock) instead of the naive restore below, to
//      avoid the double stock-restoration race against admin cancels.
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "This endpoint is disabled." },
    { status: 404 },
  );
}

/* ─────────────── ORIGINAL IMPLEMENTATION (disabled for MVP) ───────────────
import prisma from "@/lib/config/prisma";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Stale threshold: PENDING orders older than 24 hours
  const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const staleOrders = await prisma.order.findMany({
      where: {
        status: "PENDING",
        paymentStatus: "UNPAID",
        createdAt: { lt: threshold },
      },
      include: { items: true },
      take: 50, // Batch limit
    });

    let cleanedCount = 0;

    for (const order of staleOrders) {
      await prisma.$transaction(async (tx) => {
        // Restore stock for all items
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
          },
        });
      });

      cleanedCount++;
    }

    return NextResponse.json({
      ok: true,
      processed: cleanedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Stale order cleanup cron failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
────────────────────────────────────────────────────────────────────────────*/
