import { getBrands, getCategories } from "@/lib/categories";
import { ProductsList } from "@/components/shop/ProductsList";
import { ShopBreadcrumbs } from "@/components/shop/Breadcrumbs";
import { SearchInput } from "@/components/shop/SearchInput";
import { FilterMenu } from "@/components/shop/FilterMenu";
import { Suspense } from "react";
import { ProductsSkeleton } from "@/components/products/ProductsSkeleton";

export default async function ShopPage() {
  const [categories, brands] = await Promise.all([getCategories(), getBrands()]);

  return (
    <div className="space-y-4">
      <ShopBreadcrumbs />
      <div className="flex items-center gap-2">
        <SearchInput />
        <div className="lg:hidden">
          <FilterMenu categories={categories} brands={brands} />
        </div>
      </div>
      <Suspense fallback={<ProductsSkeleton />}>
        <ProductsList />
      </Suspense>
    </div>
  );
}
