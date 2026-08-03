import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBrands } from "@/lib/brands/queries";
import { BrandList } from "@/components/admin/brands";

export default async function BrandsPage() {
  const brands = await getBrands();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Brands</h1>
          <p className="text-sm text-muted-foreground">
            Manage product brands
          </p>
        </div>
        <Link href="/admin/brands/new">
          <Button className="cursor-pointer">
            <Plus className="mr-1.5 h-4 w-4" />
            New Brand
          </Button>
        </Link>
      </div>

      <BrandList brands={brands} />
    </div>
  );
}
