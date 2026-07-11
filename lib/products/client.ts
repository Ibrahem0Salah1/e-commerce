import type { ProductsResult } from "@/lib/types";
import type { ProductFilters } from "@/lib/products/filters";

export async function getProductsClient(
  filters: ProductFilters,
): Promise<ProductsResult> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== false
    ) {
      params.set(key, String(value));
    }
  });

  const res = await fetch(`/api/products?${params}`);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}
