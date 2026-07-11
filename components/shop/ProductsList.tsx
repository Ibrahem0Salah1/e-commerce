"use client";

import { ProductCard } from "@/components/products/ProductCard";
import { ProductsSkeleton } from "@/components/products/ProductsSkeleton";
import { useProducts } from "@/hooks/useProducts";
import { Pagination } from "@/components/shop/Pagination";
import { formatNumber } from "@/lib/utils/format";
import type { ProductsResult } from "@/lib/types";

export function ProductsList({ initialData }: { initialData?: ProductsResult }) {
  const { data: queryData, isLoading, isRefetching } = useProducts(initialData);

  // Always have data: query result falls back to server-provided initialData.
  // This prevents hydration mismatch when nuqs queryKey differs momentarily.
  const data = queryData ?? initialData;

  if (isLoading || isRefetching) {
    console.log("ProductsList: loading, no data yet");
    return <ProductsSkeleton />;
  }

  if (!data) {
    return <p className="text-center text-muted-foreground">No products found.</p>;
  }

  return (
    <div className="relative space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          {formatNumber(data.pagination.total)} products available
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {data.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <Pagination totalPages={data.pagination.totalPages} />
    </div>
  );
}
