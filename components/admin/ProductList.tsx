"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, Package, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ProductListItem } from "@/lib/types";
import { formatNumber } from "@/lib/utils/format";

type ProductListProps = {
  products: ProductListItem[];
  onDelete: (productId: string) => void;
  onToggleActive: (productId: string) => void;
};

export function ProductList({ products, onDelete, onToggleActive }: ProductListProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="mb-3 h-12 w-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No products found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {products.map((product) => {
        const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

        return (
          <Link
            key={product.id}
            href={`/admin/product/${product.slug}`}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm block"
          >
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-secondary/40 sm:size-20">
              <Image
                src={product.images[0] || "/placeholder-product.png"}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 64px, 80px"
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {product.name}
                    </p>
                    <Badge
                      variant={product.isActive ? "default" : "destructive"}
                      className={`shrink-0 text-[10px] ${
                        product.isActive
                          ? "bg-emerald-600 hover:bg-emerald-600"
                          : ""
                      }`}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    {product.category && (
                      <Badge variant="secondary" className="text-[10px]">
                        {product.category.name}
                      </Badge>
                    )}
                    {product.brand && (
                      <span className="text-[10px] text-muted-foreground">
                        {product.brand.name}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="cursor-pointer text-muted-foreground hover:text-primary"
                    onClick={() => {
                      if (
                        confirm(
                          product.isActive
                            ? `Deactivate "${product.name}"? It will be hidden from the shop.`
                            : `Activate "${product.name}"? It will appear on the shop.`,
                        )
                      ) {
                        onToggleActive(product.id);
                      }
                    }}
                    aria-label={
                      product.isActive
                        ? `Deactivate ${product.name}`
                        : `Activate ${product.name}`
                    }
                  >
                    {product.isActive ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="cursor-pointer text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(product.id)}
                    aria-label={`Delete ${product.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    From {formatNumber(product.basePrice)} EGP
                  </span>
                  <span className="text-muted-foreground/40">|</span>
                  <span>
                    {product.variants.length} variant
                    {product.variants.length !== 1 ? "s" : ""}
                  </span>
                  <span className="text-muted-foreground/40">|</span>
                  <span>
                    {totalStock} in stock
                  </span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
