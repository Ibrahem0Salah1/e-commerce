import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/config/prisma";
import { NewInvoiceForm } from "@/components/admin/NewInvoiceForm";
import { AdminRules } from "@/components/admin/AdminRules";

export default async function RestockPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true, archived: false },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      stock: true,
      // price: true,
      // images: true,
    },
  });

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">New Purchase Invoice</h1>
          <p className="text-sm text-muted-foreground">
            Record a new stock delivery from a supplier
          </p>
        </div>
      </div>

      <AdminRules variant="restock" />

      {products.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No products found.{" "}
            <Link href="/admin/products/new" className="text-primary hover:underline">
              Create a product first
            </Link>
            .
          </p>
        </div>
      ) : (
        <NewInvoiceForm products={products} />
      )}
    </section>
  );
}
