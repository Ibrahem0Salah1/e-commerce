// app/shop/page.tsx
import { getCategoriesWithFamilies } from "@/lib/categories/queries";
import { getBrands } from "@/lib/brands/queries";
import { ProductsListServer } from "@/components/shop/ProductsListServer";
import { ShopBreadcrumbs } from "@/components/shop/Breadcrumbs";
import { SearchInput } from "@/components/shop/SearchInput";
import { FilterMenu } from "@/components/shop/FilterMenu";
import { Suspense } from "react";
import { ProductsSkeleton } from "@/components/products/ProductsSkeleton";
import { searchParamsCache } from "@/lib/products/filters";
import { getProductsServerWithInventory } from "@/lib/products/queries"; // ← CHANGED
import type { SearchParams } from "nuqs/server";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [categories, brands, filters] = await Promise.all([
    getCategoriesWithFamilies(),
    getBrands(),
    searchParamsCache.parse(searchParams),
  ]);

  // ← CHANGED: use the wrapper that merges fresh inventory
  const productsPromise = getProductsServerWithInventory(filters);
  return (
    <div className="relative space-y-4">
      <ShopBreadcrumbs categories={categories} brands={brands} />
      <div className="flex items-center gap-2">
        <SearchInput />
        <div className="lg:hidden">
          <FilterMenu categories={categories} brands={brands} />
        </div>
      </div>
      <Suspense fallback={<ProductsSkeleton />}>
        <ProductsListServer productsPromise={productsPromise} />
      </Suspense>
    </div>
  );
}