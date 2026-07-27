"use server";

import { revalidateTag } from "next/cache";
import prisma from "@/lib/config/prisma";
import { requireAdmin } from "@/lib/auth/authz";
import { createPurchaseInvoiceSchema } from "@/lib/validations";

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

    for (const line of data.lines) {
      const sellingPrice = Number(
        (line.costPrice * (1 + line.marginPercent / 100)).toFixed(2),
      );

      await tx.product.update({
        where: { id: line.productId },
        data: {
          costPrice: line.costPrice,         // ← live cost
          marginPercent: line.marginPercent, // ← live margin
          price: sellingPrice,               // ← live selling price
          stock: { increment: line.quantityAdded },
        },
      });

      await tx.restockEntry.create({
        data: {
          invoiceId: invoice.id,
          productId: line.productId,
          costPrice: line.costPrice,
          marginPercent: line.marginPercent,
          sellingPrice,
          quantityAdded: line.quantityAdded,
        },
      });
    }

    return invoice;
  });

  revalidateTag("products", "max");
  return result;
}