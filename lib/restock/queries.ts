import "server-only";

import prisma from "@/lib/config/prisma";

export async function getPurchaseInvoices() {
  return prisma.purchaseInvoice.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      supplierName: true,
      invoiceNumber: true,
      supplierPhone: true,
      totalCost: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
  });
}

export async function getPurchaseInvoiceById(id: string) {
  return prisma.purchaseInvoice.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          variant: {
            include: { product: { select: { name: true, slug: true } } },
          },
        },
      },
    },
  });
}
