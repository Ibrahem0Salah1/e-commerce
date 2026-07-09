"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getProductsClient } from "@/lib/products/client"; // ← client-safe function
import type { ProductsResult } from "@/lib/types";
import { useProductFilters } from "./use-product-filters";

export function useProducts(initialData?: ProductsResult) {
  const [filters] = useProductFilters();

  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => getProductsClient(filters),
    placeholderData: keepPreviousData,
    initialData,
    staleTime: 30_000,
    // enabled: typeof window !== "undefined",
  });
}
