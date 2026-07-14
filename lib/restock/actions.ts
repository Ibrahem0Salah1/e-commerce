"use server";

import { revalidateTag } from "next/cache";
import prisma from "@/lib/config/prisma";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/authz";
import { createPurchaseInvoiceSchema } from "@/lib/validations";

async function recomputeBasePrice(
  tx: Prisma.TransactionClient,
  productId: string,
) {
  const cheapest = await tx.variant.aggregate({
    where: { productId, isActive: true, archived: false },
    _min: { price: true },
  });
  if (cheapest._min.price !== null) {
    await tx.product.update({
      where: { id: productId },
      data: { basePrice: cheapest._min.price },
    });
  }
}

export async function createPurchaseInvoiceAndInvalidate(raw: unknown) {
  await requireAdmin();

  const data = createPurchaseInvoiceSchema.parse(raw);

  const totalCost = data.lines.reduce(
    (sum, line) => sum + line.costPrice * line.quantityAdded,
    0,
  );

  const result = await prisma.$transaction(async (tx) => {
    const invoice = await tx.purchaseInvoice.create({
      data: {
        supplierName: data.supplierName || null,
        invoiceNumber: data.invoiceNumber || null,
        supplierPhone: data.supplierPhone || null,
        totalCost,
      },
    });

    const touchedProductIds = new Set<string>();

    for (const line of data.lines) {
      const sellingPrice = line.costPrice * (1 + line.marginPercent / 100);

      const variant = await tx.variant.update({
        where: { id: line.variantId },
        data: {
          costPrice: line.costPrice,
          marginPercent: line.marginPercent,
          price: sellingPrice,
          stock: { increment: line.quantityAdded },
        },
        select: { productId: true },
      });

      await tx.restockEntry.create({
        data: {
          invoiceId: invoice.id,
          variantId: line.variantId,
          costPrice: line.costPrice,
          marginPercent: line.marginPercent,
          sellingPrice,
          quantityAdded: line.quantityAdded,
        },
      });

      touchedProductIds.add(variant.productId);
    }

    for (const productId of touchedProductIds) {
      await recomputeBasePrice(tx, productId);
    }

    return invoice;
  });

  revalidateTag("products", "default");

  return result;
}
