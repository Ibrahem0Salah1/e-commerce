import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCategories } from "@/lib/categories/queries";
import { CategoryList } from "@/components/admin/categories";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Manage product categories
          </p>
        </div>
        <Link href="/admin/categories/new">
          <Button className="cursor-pointer">
            <Plus className="mr-1.5 h-4 w-4" />
            New Category
          </Button>
        </Link>
      </div>

      <CategoryList categories={categories} />
    </div>
  );
}
