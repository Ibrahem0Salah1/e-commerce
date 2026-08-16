// app/admin/(protected)/products/page.tsx
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminProductsTable } from "@/components/admin/AdminProductsTable";
import { getCategoriesWithFamilies } from "@/lib/categories/queries";
import { getBrands } from "@/lib/brands/queries";
import { getAdminProducts } from "@/lib/admin/products";
import { searchParamsCache } from "@/lib/products/filters";
import type { SearchParams } from "nuqs/server";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [categories, brands, filters] = await Promise.all([
    getCategoriesWithFamilies(),
    getBrands(),
    searchParamsCache.parse(searchParams),
  ]);

  const initialData = await getAdminProducts(filters);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage product inventory and listings
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button className="cursor-pointer">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      <AdminProductsTable
        initialData={initialData}
        categories={categories}
        brands={brands}
      />
    </div>
  );
}
