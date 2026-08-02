import { getCategoriesWithFamilies } from "@/lib/categories/queries";
import { getBrands } from "@/lib/brands/queries";
import CategoriesMenuClient from "./CategoriesMenuClient"

export async function CategoriesMenu() {
  const [categories, brands] = await Promise.all([
    getCategoriesWithFamilies(),
    getBrands(),
  ]);
  return <CategoriesMenuClient categories={categories} brands={brands} />;
}