"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Edit, Trash2, ToggleLeft, ToggleRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, DeleteConfirmDialog } from "@/components/admin/shared";
import {
  deleteFamilyAndInvalidate,
  toggleFamilyActiveAndInvalidate,
} from "@/lib/families/actions";
import type { FamilyListItem } from "@/lib/families/queries";

type FamilyListProps = {
  families: FamilyListItem[];
  categorySlug: string;
};

export function FamilyList({ families, categorySlug }: FamilyListProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<FamilyListItem | null>(null);

  const handleToggle = async (slug: string) => {
    try {
      await toggleFamilyActiveAndInvalidate(slug);
      toast.success("Family status updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFamilyAndInvalidate(deleteTarget.slug);
      toast.success("Family deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
      throw err;
    }
  };

  if (families.length === 0) {
    return (
      <EmptyState
        message="No families in this category"
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border/40">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Slug</th>
              <th className="px-4 py-3 text-center font-medium">Products</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {families.map((fam) => (
              <tr
                key={fam.id}
                className="transition-colors hover:bg-secondary/40"
              >
                <td className="px-4 py-3 font-medium">{fam.name}</td>
                <td className="px-4 py-3 text-muted-foreground">/{fam.slug}</td>
                <td className="px-4 py-3 text-center tabular-nums text-muted-foreground">
                  {fam._count.products}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge
                    variant={fam.isActive ? "default" : "destructive"}
                    className={`text-[10px] ${
                      fam.isActive
                        ? "bg-emerald-600 hover:bg-emerald-600"
                        : ""
                    }`}
                  >
                    {fam.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="cursor-pointer text-muted-foreground hover:text-primary"
                      onClick={() => handleToggle(fam.slug)}
                      aria-label={
                        fam.isActive
                          ? `Deactivate ${fam.name}`
                          : `Activate ${fam.name}`
                      }
                    >
                      {fam.isActive ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </Button>
                    <Link
                      href={`/admin/categories/${categorySlug}/families/${fam.slug}/edit`}
                    >
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="cursor-pointer text-muted-foreground hover:text-primary"
                        aria-label={`Edit ${fam.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="cursor-pointer text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(fam)}
                      aria-label={`Delete ${fam.name}`}
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
            ? `Cannot delete: ${deleteTarget._count.products} product(s) are still assigned to this family.`
            : `Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`
        }
        onConfirm={handleDelete}
      />
    </>
  );
}
