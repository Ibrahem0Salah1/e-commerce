// app/admin/(protected)/products/page.tsx
import { Suspense } from "react";
import { getAdminAllProducts } from "@/lib/admin/products"; // ← swap this import
import { ProductsPageClient } from "./ProductsPageClient";
import { plain } from "@/lib/utils/serialize";

export default async function AdminProductsPage() {
  const products = await getAdminAllProducts(); // ← and this call

  return (
    <section className="space-y-6">
      {/* unchanged */}
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading...</div>}>
        <ProductsPageClient products={plain(products)} />
      </Suspense>
    </section>
  );
}