"use client";

import { ProductCard } from "@/components/products/ProductCard";
import { ProductsSkeleton } from "@/components/products/ProductsSkeleton";
import { useProducts } from "@/hooks/useProducts";
import { Pagination } from "@/components/shop/Pagination";
import { Loader2 } from "lucide-react";

export function ProductsList() {
  const { data, isLoading, isFetching } = useProducts();

  // true first load — no cached/placeholder data exists yet
  if (isLoading) {
    return <ProductsSkeleton />;
  }

  if (!data) {
    return <p className="text-center text-muted-foreground">No products found.</p>;
  }

  // refetching with `keepPreviousData` — old grid stays visible, dimmed
  const isRefetching = isFetching && !isLoading;

  return (
    <section className="relative space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          {data.pagination.total.toLocaleString()} products available
          {isRefetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
        </p>
      </div>

      <div
        className={`grid grid-cols-1 gap-4 transition-opacity duration-200 sm:grid-cols-2 xl:grid-cols-3 ${isRefetching ? "opacity-50" : "opacity-100"
          }`}
        aria-busy={isRefetching}
      >
        {data.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <Pagination totalPages={data.pagination.totalPages} />
    </section>
  );
}