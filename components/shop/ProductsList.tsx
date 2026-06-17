"use client";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductsSkeleton } from "@/components/products/ProductsSkeleton";
import { useProducts } from "@/hooks/useProducts";
import { Pagination } from "@/components/shop/Pagination";
export function ProductsList() {
  const { data, isFetching } = useProducts();
  if (!data && isFetching) {
    return <ProductsSkeleton />;
  }
  if (!data) {
    return <p className="text-center text-muted-foreground">No products found.</p>;
  }
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.pagination.total.toLocaleString()} products available
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <Pagination totalPages={data.pagination.totalPages} />
    </section>
  );
}
