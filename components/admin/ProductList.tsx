"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ProductListItem } from "@/lib/types";
import { formatNumber } from "@/lib/utils/format";

type ProductListProps = {
  products: ProductListItem[];
  onDelete: (productId: string) => void;
};

export function ProductList({ products, onDelete }: ProductListProps) {
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
        const inStock = product.variants.some((v) => v.stock > 0);

        return (
          <div
            key={product.id}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm"
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
                  <p className="truncate text-sm font-medium text-foreground">
                    {product.name}
                  </p>
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

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    asChild
                    className="cursor-pointer text-muted-foreground hover:text-primary"
                  >
                    <Link
                      href={`/admin/product/${product.slug}`}
                      aria-label={`View ${product.name}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
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
                    {formatNumber(product.basePrice)} EGP
                  </span>
                  <span className="text-muted-foreground/40">|</span>
                  <span>
                    {product.variants.length} variant
                    {product.variants.length !== 1 ? "s" : ""}
                  </span>
                  <span className="text-muted-foreground/40">|</span>
                  {inStock ? (
                    <span className="text-emerald-600">In stock</span>
                  ) : (
                    <span className="text-destructive">Out of stock</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
