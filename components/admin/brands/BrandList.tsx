"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, DeleteConfirmDialog } from "@/components/admin/shared";
import {
  deleteBrandAndInvalidate,
  toggleBrandActiveAndInvalidate,
} from "@/lib/brands/actions";
import type { BrandListItem } from "@/lib/brands/queries";

type BrandListProps = {
  brands: BrandListItem[];
};

export function BrandList({ brands }: BrandListProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<BrandListItem | null>(null);

  const handleToggle = async (slug: string) => {
    try {
      await toggleBrandActiveAndInvalidate(slug);
      toast.success("Brand status updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBrandAndInvalidate(deleteTarget.slug);
      toast.success("Brand deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
      throw err;
    }
  };

  if (brands.length === 0) {
    return <EmptyState message="No brands found" />;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border/40">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Logo</th>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Slug</th>
              <th className="px-4 py-3 text-center font-medium">Products</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {brands.map((brand) => (
              <tr
                key={brand.id}
                className="transition-colors hover:bg-secondary/40"
              >
                <td className="px-4 py-3">
                  {brand.logo ? (
                    <div className="relative h-8 w-8 overflow-hidden rounded bg-secondary/40">
                      <Image
                        src={brand.logo}
                        alt={brand.name}
                        fill
                        className="object-contain"
                        sizes="32px"
                      />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-secondary/40 text-xs text-muted-foreground">
                      —
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-medium">{brand.name}</td>
                <td className="px-4 py-3 text-muted-foreground">/{brand.slug}</td>
                <td className="px-4 py-3 text-center tabular-nums text-muted-foreground">
                  {brand._count.products}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge
                    variant={brand.isActive ? "default" : "destructive"}
                    className={`text-[10px] ${
                      brand.isActive
                        ? "bg-emerald-600 hover:bg-emerald-600"
                        : ""
                    }`}
                  >
                    {brand.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="cursor-pointer text-muted-foreground hover:text-primary"
                      onClick={() => handleToggle(brand.slug)}
                      aria-label={
                        brand.isActive
                          ? `Deactivate ${brand.name}`
                          : `Activate ${brand.name}`
                      }
                    >
                      {brand.isActive ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </Button>
                    <Link href={`/admin/brands/${brand.slug}/edit`}>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="cursor-pointer text-muted-foreground hover:text-primary"
                        aria-label={`Edit ${brand.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="cursor-pointer text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(brand)}
                      aria-label={`Delete ${brand.name}`}
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
            ? `Cannot delete: ${deleteTarget._count.products} product(s) are still assigned to this brand.`
            : `Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`
        }
        onConfirm={handleDelete}
      />
    </>
  );
}
