"use client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getProducts } from "@/lib/products";
import { useProductFilters } from "./use-product-filters";
export function useProducts() {
  const [filters] = useProductFilters();

  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => getProducts(filters),
    placeholderData: keepPreviousData,
  });
}
