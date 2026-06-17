import { ShopFiltersClient } from "./ShopFiltersClient";

export async function ShopFilters({
  categories,
  brands,
}: {
  categories: { id: string; name: string; slug: string }[];
  brands: { id: string; name: string; slug: string; logo: string | null }[];
}) {
  return <ShopFiltersClient categories={categories} brands={brands} />;
}
