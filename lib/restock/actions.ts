// lib/restock/actions.ts
"use server";

import prisma from "@/lib/config/prisma";
import { requireAdmin } from "@/lib/auth/authz";
import { createPurchaseInvoiceSchema } from "@/lib/validations";
import { invalidateCache, invalidatePattern } from "@/lib/config/redis";

export async function createPurchaseInvoiceAndInvalidate(raw: unknown) {
  await requireAdmin();

  const data = createPurchaseInvoiceSchema.parse(raw);

  // ── FIX #1: Pre-fetch slugs to avoid N+1 after transaction ──
  const products = await prisma.product.findMany({
    where: { id: { in: data.lines.map((l) => l.productId) } },
    select: { id: true, slug: true },
  });
  const slugById = new Map(products.map((p) => [p.id, p.slug]));

  const totalCost = data.lines.reduce(
    (sum, line) => sum + line.costPrice * line.quantityAdded,
    0,
  );

  const invoice = await prisma.$transaction(async (tx) => {
    const created = await tx.purchaseInvoice.create({
      data: {
        supplierName: data.supplierName || null,
        invoiceNumber: data.invoiceNumber || null,
        supplierPhone: data.supplierPhone || null,
        totalCost,
      },
    });

    for (const line of data.lines) {
      const sellingPrice = Number(
        (line.costPrice * (1 + line.marginPercent / 100)).toFixed(2),
      );

      // Do not resurrect archived products — require manual unarchive first.
      const existing = await tx.product.findUnique({
        where: { id: line.productId },
        select: { archived: true, isActive: true },
      });
      await tx.product.update({
        where: { id: line.productId },
        data: {
          costPrice: line.costPrice,
          marginPercent: line.marginPercent,
          price: sellingPrice,
          stock: { increment: line.quantityAdded },
          // auto-activate only if not archived; archived stays archived
          ...(existing?.archived ? {} : { isActive: true }),
        },
      });

      await tx.restockEntry.create({
        data: {
          invoiceId: created.id,
          productId: line.productId,
          costPrice: line.costPrice,
          marginPercent: line.marginPercent,
          sellingPrice,
          quantityAdded: line.quantityAdded,
        },
      });
    }

    return created;
  });

  // ── FIX #2: Cache invalidation is "best effort" ──
  // If Redis is down, the restock MUST still succeed.
  // Stale cache auto-expires via TTL anyway.
  try {
    const invalidationPromises: Promise<void>[] = [];

    for (const line of data.lines) {
      const slug = slugById.get(line.productId);
      if (slug) {
        invalidationPromises.push(invalidateCache(`product:detail:${slug}`));
      }
    }

    // Broad invalidation: price changed, so ALL list pages are stale
    invalidationPromises.push(invalidatePattern("products:*"));

    await Promise.all(invalidationPromises);
  } catch (err) {
    console.error("[Restock] Cache invalidation failed (non-critical):", err);
  }

  return { id: invoice.id };
}