import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPurchaseInvoiceById } from "@/lib/restock/queries";
import { formatNumber } from "@/lib/utils/format";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getPurchaseInvoiceById(id);

  if (!invoice) notFound();

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/invoices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">
            Invoice {invoice.invoiceNumber ?? `\u2014${invoice.id.slice(0, 8)}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date(invoice.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Invoice Details
            </h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Supplier</dt>
                <dd className="font-medium">{invoice.supplierName ?? "\u2014"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Invoice #</dt>
                <dd className="font-mono text-xs">{invoice.invoiceNumber ?? "\u2014"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="font-medium">{invoice.supplierPhone ?? "\u2014"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Total Cost</dt>
                <dd className="font-medium">
                  {formatNumber(Number(invoice.totalCost))} EGP
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Line Items ({invoice.items.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Product</th>
                    <th className="pb-2 pr-4 font-medium">Variant</th>
                    <th className="pb-2 pr-4 font-medium">Cost</th>
                    <th className="pb-2 pr-4 font-medium">Margin</th>
                    <th className="pb-2 pr-4 font-medium">Selling</th>
                    <th className="pb-2 pr-4 font-medium">Qty</th>
                    <th className="pb-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => {
                    const lineTotal = Number(item.costPrice) * item.quantityAdded;
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="py-2 pr-4">
                          <Link
                            href={`/admin/product/${item.variant.product.slug}`}
                            className="font-medium text-foreground underline-offset-2 hover:underline"
                          >
                            {item.variant.product.name}
                          </Link>
                        </td>
                        <td className="py-2 pr-4">{item.variant.name}</td>
                        <td className="py-2 pr-4">
                          {formatNumber(Number(item.costPrice))} EGP
                        </td>
                        <td className="py-2 pr-4">
                          {Number(item.marginPercent)}%
                        </td>
                        <td className="py-2 pr-4 font-medium">
                          {formatNumber(Number(item.sellingPrice))} EGP
                        </td>
                        <td className="py-2 pr-4">{item.quantityAdded}</td>
                        <td className="py-2 text-right font-medium">
                          {formatNumber(lineTotal)} EGP
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Summary
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Items</span>
                <span className="font-medium">{invoice.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Units</span>
                <span className="font-medium">
                  {invoice.items.reduce((sum, item) => sum + item.quantityAdded, 0)}
                </span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="font-medium">Total Cost</span>
                <span className="font-bold">
                  {formatNumber(Number(invoice.totalCost))} EGP
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
