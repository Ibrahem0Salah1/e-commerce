import { Suspense } from "react";
import { getAdminAllProducts } from "@/lib/admin/products";
import { ProductsPageClient } from "./ProductsPageClient";

export default async function AdminProductsPage() {
  const products = await getAdminAllProducts();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Products</h1>
        <p className="text-sm text-muted-foreground">
          Manage your product catalog
        </p>
      </div>

      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading...</div>}>
        <ProductsPageClient products={products} />
      </Suspense>
    </section>
  );
}
