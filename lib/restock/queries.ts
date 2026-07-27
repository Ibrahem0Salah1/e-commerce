import "server-only";
import prisma from "@/lib/config/prisma";

export type PurchaseInvoiceListItem = {
  id: string;
  supplierName: string | null;
  invoiceNumber: string | null;
  supplierPhone: string | null;
  totalCost: number;
  createdAt: string;
  _count: { items: number };
};

export async function getPurchaseInvoices(): Promise<PurchaseInvoiceListItem[]> {
  const invoices = await prisma.purchaseInvoice.findMany({
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

  return invoices.map((inv) => ({
    ...inv,
    totalCost: Number(inv.totalCost),
    createdAt: inv.createdAt.toISOString(),
  }));
}

export async function getPurchaseInvoiceById(id: string) {
  const invoice = await prisma.purchaseInvoice.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  return invoice;
} 