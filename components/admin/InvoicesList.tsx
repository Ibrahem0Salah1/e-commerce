"use client";

import Link from "next/link";
import { formatNumber } from "@/lib/utils/format";

type Invoice = {
  id: string;
  supplierName: string | null;
  invoiceNumber: string | null;
  totalCost: { toString(): string };
  createdAt: Date;
  _count: { items: number };
};

type Props = {
  invoices: Invoice[];
};

export function InvoicesList({ invoices }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Invoice #</th>
            <th className="px-4 py-3 font-medium">Supplier</th>
            <th className="px-4 py-3 font-medium">Items</th>
            <th className="px-4 py-3 font-medium text-right">Total Cost</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr
              key={invoice.id}
              className="border-b border-border/50 transition-colors hover:bg-secondary/40 last:border-0"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/admin/invoices/${invoice.id}`}
                  className="block"
                >
                  {new Date(invoice.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </Link>
              </td>
              <td className="px-4 py-3 font-mono text-xs">
                <Link
                  href={`/admin/invoices/${invoice.id}`}
                  className="block"
                >
                  {invoice.invoiceNumber ?? "\u2014"}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/invoices/${invoice.id}`}
                  className="block"
                >
                  {invoice.supplierName ?? "\u2014"}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/invoices/${invoice.id}`}
                  className="block"
                >
                  {invoice._count.items} item{invoice._count.items !== 1 ? "s" : ""}
                </Link>
              </td>
              <td className="px-4 py-3 text-right font-medium">
                <Link
                  href={`/admin/invoices/${invoice.id}`}
                  className="block"
                >
                  {formatNumber(Number(invoice.totalCost))} EGP
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
