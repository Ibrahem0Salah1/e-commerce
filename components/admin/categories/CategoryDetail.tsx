"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus, Edit, ListTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/admin/shared";
import type { CategoryDetail } from "@/lib/categories/queries";

type CategoryDetailProps = {
  category: CategoryDetail;
};

export function CategoryDetail({ category }: CategoryDetailProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border/40 bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">{category.name}</h1>
              <Badge
                variant={category.isActive ? "default" : "destructive"}
                className={`text-[10px] ${
                  category.isActive ? "bg-emerald-600 hover:bg-emerald-600" : ""
                }`}
              >
                {category.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">/{category.slug}</p>
            {category.description && (
              <p className="text-sm text-muted-foreground">
                {category.description}
              </p>
            )}
            <div className="flex gap-4 pt-1 text-xs text-muted-foreground">
              <span>
                <strong className="tabular-nums">
                  {category._count.families}
                </strong>{" "}
                families
              </span>
              <span>
                <strong className="tabular-nums">
                  {category._count.products}
                </strong>{" "}
                products
              </span>
            </div>
          </div>

          {category.image && (
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-secondary/40">
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Link href={`/admin/categories/${category.slug}/edit`}>
            <Button variant="outline" size="sm" className="cursor-pointer">
              <Edit className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
          </Link>
          <Link
            href={`/admin/categories/${category.slug}/families/new`}
          >
            <Button size="sm" className="cursor-pointer">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Family
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-border/40 bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Product Families
        </h2>

        {category.families.length === 0 ? (
          <EmptyState
            icon={<ListTree className="mb-3 h-12 w-12 text-muted-foreground/40" />}
            message="No families in this category"
          />
        ) : (
          <div className="overflow-x-auto">
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
                {category.families.map((family) => (
                  <tr
                    key={family.id}
                    className="transition-colors hover:bg-secondary/40"
                  >
                    <td className="px-4 py-3 font-medium">{family.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      /{family.slug}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-muted-foreground">
                      {family._count.products}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={family.isActive ? "default" : "destructive"}
                        className={`text-[10px] ${
                          family.isActive
                            ? "bg-emerald-600 hover:bg-emerald-600"
                            : ""
                        }`}
                      >
                        {family.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/categories/${category.slug}/families/${family.slug}/edit`}
                        >
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="cursor-pointer text-muted-foreground hover:text-primary"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
