import { ShopFiltersClient } from "./ShopFiltersClient";

type FamilyOption = { id: string; name: string; slug: string };

type CategoryWithFamilies = {
  id: string;
  name: string;
  slug: string;
  families: FamilyOption[];
};

export async function ShopFilters({
  categories,
  brands,
}: {
  categories: CategoryWithFamilies[];
  brands: { id: string; name: string; slug: string; logo: string | null }[];
}) {
  return <ShopFiltersClient categories={categories} brands={brands} />;
}
