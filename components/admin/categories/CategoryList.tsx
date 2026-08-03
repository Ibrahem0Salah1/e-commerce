"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Edit, Trash2, ToggleLeft, ToggleRight, ListTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, DeleteConfirmDialog } from "@/components/admin/shared";
import {
  deleteCategoryAndInvalidate,
  toggleCategoryActiveAndInvalidate,
} from "@/lib/categories/actions";
import type { CategoryListItem } from "@/lib/categories/queries";

type CategoryListProps = {
  categories: CategoryListItem[];
};

export function CategoryList({ categories }: CategoryListProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<CategoryListItem | null>(null);

  const handleToggle = async (slug: string) => {
    try {
      await toggleCategoryActiveAndInvalidate(slug);
      toast.success("Category status updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategoryAndInvalidate(deleteTarget.slug);
      toast.success("Category deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
      throw err;
    }
  };

  if (categories.length === 0) {
    return <EmptyState message="No categories found" />;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border/40">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Slug</th>
              <th className="px-4 py-3 text-center font-medium">Families</th>
              <th className="px-4 py-3 text-center font-medium">Products</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {categories.map((cat) => (
              <tr
                key={cat.id}
                className="transition-colors hover:bg-secondary/40"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/categories/${cat.slug}`}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {cat.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">/{cat.slug}</td>
                <td className="px-4 py-3 text-center tabular-nums text-muted-foreground">
                  {cat._count.families}
                </td>
                <td className="px-4 py-3 text-center tabular-nums text-muted-foreground">
                  {cat._count.products}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge
                    variant={cat.isActive ? "default" : "destructive"}
                    className={`text-[10px] ${
                      cat.isActive
                        ? "bg-emerald-600 hover:bg-emerald-600"
                        : ""
                    }`}
                  >
                    {cat.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="cursor-pointer text-muted-foreground hover:text-primary"
                      onClick={() => handleToggle(cat.slug)}
                      aria-label={
                        cat.isActive
                          ? `Deactivate ${cat.name}`
                          : `Activate ${cat.name}`
                      }
                    >
                      {cat.isActive ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </Button>
                    <Link href={`/admin/categories/${cat.slug}/edit`}>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="cursor-pointer text-muted-foreground hover:text-primary"
                        aria-label={`Edit ${cat.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="cursor-pointer text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(cat)}
                      aria-label={`Delete ${cat.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description={
          deleteTarget && deleteTarget._count.products > 0
            ? `Cannot delete: ${deleteTarget._count.products} product(s) are still assigned to this category.`
            : `Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`
        }
        onConfirm={handleDelete}
      />
    </>
  );
}
