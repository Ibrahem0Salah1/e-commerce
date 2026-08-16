"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, ExternalLink, Loader2, Minus, ToggleLeft, ToggleRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/shared";
import { Pagination } from "@/components/shop/Pagination";
import { AdminFilters } from "./AdminFilters";
import { AdminSearchInput } from "./AdminSearchInput";
import { toggleProductActiveAndInvalidate } from "@/lib/admin/actions";
import { useAdminProducts } from "@/hooks/useAdminProducts";
import { formatNumber } from "@/lib/utils/format";
import type {
  BrandListItem,
  CategoryWithFamilies,
  ProductListItem,
  ProductsResult,
} from "@/lib/types";

type Props = {
  initialData: ProductsResult;
  categories: CategoryWithFamilies[];
  brands: BrandListItem[];
};

export function AdminProductsTable({ initialData, categories, brands }: Props) {
  const { data, isFetching, isError } = useAdminProducts(initialData);
  const queryClient = useQueryClient();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const products = data?.products ?? [];
  const pagination = data?.pagination ?? initialData.pagination;

  async function handleToggle(product: ProductListItem) {
    setTogglingId(product.id);
    try {
      await toggleProductActiveAndInvalidate(product.id);
      toast.success("Product status updated");
      void queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (err) {
      toast.error("Failed to update product", {
        description: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <AdminSearchInput />
        <span className="text-xs text-muted-foreground">
          {isFetching
            ? "Refreshing..."
            : `${formatNumber(pagination.total)} product${pagination.total === 1 ? "" : "s"}`}
        </span>
      </div>

      <AdminFilters categories={categories} brands={brands} />

      {isError && (
        <p className="text-xs text-destructive">
          Failed to refresh products. Showing the last loaded results.
        </p>
      )}

      {products.length === 0 ? (
        <EmptyState message="No products found" />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border/40">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Product</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">Family</th>
                  <th className="px-4 py-3 text-left font-medium">Brand</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 text-right font-medium">Stock</th>
                  <th className="px-4 py-3 text-center font-medium">Featured</th>
                  <th className="px-4 py-3 text-center font-medium">Best Seller</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="transition-colors hover:bg-secondary/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-secondary/40">
                          <Image
                            src={product.images[0] || "/placeholder-product.png"}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/product/${product.slug}`}
                            className="block max-w-56 truncate font-medium text-foreground hover:text-primary"
                          >
                            {product.name}
                          </Link>
                          <span className="block max-w-56 truncate text-xs text-muted-foreground">
                            /{product.slug}
                            {product.madeIn ? ` · ${product.madeIn}` : ""}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {product.category?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {product.family?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {product.brand?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {product.price != null && product.price > 0
                        ? `${formatNumber(product.price)} EGP`
                        : "—"}
                    </td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums ${
                        product.stock != null && product.stock <= 0
                          ? "text-destructive"
                          : product.stock != null && product.stock < 5
                            ? "text-amber-600"
                            : "text-muted-foreground"
                      }`}
                    >
                      {product.stock != null ? formatNumber(product.stock) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {product.featured ? (
                        <Check className="mx-auto h-4 w-4 text-emerald-600" />
                      ) : (
                        <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {product.bestSeller ? (
                        <Check className="mx-auto h-4 w-4 text-emerald-600" />
                      ) : (
                        <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {product.archived ? (
                        <Badge variant="outline" className="text-[10px]">
                          Archived
                        </Badge>
                      ) : (
                        <Badge
                          variant={product.isActive ? "default" : "destructive"}
                          className={`text-[10px] ${
                            product.isActive
                              ? "bg-emerald-600 hover:bg-emerald-600"
                              : ""
                          }`}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="cursor-pointer text-muted-foreground hover:text-primary"
                          onClick={() => handleToggle(product)}
                          disabled={togglingId === product.id}
                          aria-label={
                            product.isActive
                              ? `Deactivate ${product.name}`
                              : `Activate ${product.name}`
                          }
                        >
                          {togglingId === product.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : product.isActive ? (
                            <ToggleRight className="h-4 w-4" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </Button>
                        <Link href={`/admin/product/${product.slug}`}>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="cursor-pointer text-muted-foreground hover:text-primary"
                            aria-label={`View ${product.name}`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} ·{" "}
              {formatNumber(pagination.total)} products
            </p>
            <Pagination totalPages={pagination.totalPages} />
          </div>
        </>
      )}
    </div>
  );
}
