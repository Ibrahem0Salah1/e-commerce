import { getCategoriesWithFamilies, getBrands } from "@/lib/categories/queries";
import CategoriesMenuClient from "./CategoriesMenuClient"

export async function CategoriesMenu() {
  // const categories = await getCategoriesWithFamilies();
  const [categories, brands] = await Promise.all([
    getCategoriesWithFamilies(),
    getBrands(),
  ]);
  return <CategoriesMenuClient categories={categories} brands={brands} />;
}