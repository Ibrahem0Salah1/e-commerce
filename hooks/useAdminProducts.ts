"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getAdminProductsClient } from "@/lib/admin/client";
import type { ProductsResult } from "@/lib/types";
import { useProductFilters } from "./use-product-filters";

export function useAdminProducts(initialData?: ProductsResult) {
  const [filters] = useProductFilters();

  return useQuery({
    queryKey: ["admin-products", filters],
    queryFn: () => getAdminProductsClient(filters),
    placeholderData: keepPreviousData,
    initialData,
    staleTime: 0,
  });
}
