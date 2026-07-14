import Link from "next/link";
import { ArrowLeft, Plus, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPurchaseInvoices } from "@/lib/restock/queries";
import { InvoicesList } from "@/components/admin/InvoicesList";

export default async function InvoicesPage() {
  const invoices = await getPurchaseInvoices();

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Purchase Invoices</h1>
            <p className="text-sm text-muted-foreground">
              Track all stock purchases and supplier costs
            </p>
          </div>
        </div>
        <Button asChild className="cursor-pointer">
          <Link href="/admin/restock">
            <Plus className="mr-1.5 h-4 w-4" />
            New Invoice
          </Link>
        </Button>
      </div>

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Receipt className="mb-3 h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No invoices yet</p>
          <Button asChild variant="link" className="mt-2">
            <Link href="/admin/restock">Create your first invoice</Link>
          </Button>
        </div>
      ) : (
        <InvoicesList invoices={invoices} />
      )}
    </section>
  );
}
