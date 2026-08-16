// components/products/ProductCard.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { formatNumber } from "@/lib/utils/format";

type ProductAttribute = { typeName: string; value: string };

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number | null;
  images: string[];
  brand?: { name: string } | null;
  attributes?: ProductAttribute[];
};

export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductListItem;
  priority?: boolean;
}) {
  const outOfStock = product.stock != null ? product.stock <= 0 : false;

  return (
    <Link href={`/shop/${product.slug}`} className="group block h-full">
      <Card
        data-testid="product-card"
        className="flex h-full flex-col overflow-hidden rounded-lg border border-border/40 bg-card transition-transform duration-300 hover:-translate-y-0.5"
      >
        {/* Image */}
        <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden border-b border-border/20 bg-background p-3">
          <Image
            src={product.images[0] ?? "/zz.svg"}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 300px"
            className="object-contain p-1 transition-transform duration-500 group-hover:scale-[1.03]"
          />

          {product.brand && (
            <Badge
              variant="secondary"
              className="absolute left-3 top-3 rounded-md px-2 py-0.5 text-[10px] font-medium"
            >
              {product.brand.name}
            </Badge>
          )}

          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <Badge variant="destructive" className="rounded-md px-3 py-1 text-xs">
                Out of Stock
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-4">
          {product.brand && (
            <span className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {product.brand.name}
            </span>
          )}

          <h3 className="line-clamp-2 text-[15px] font-semibold leading-5 text-foreground">
            {product.name}
          </h3>

          {product.attributes && product.attributes.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {product.attributes.slice(0, 3).map((attr) => (
                <Badge
                  key={attr.typeName}
                  variant="outline"
                  className="h-5 px-1.5 text-[10px] font-normal text-muted-foreground"
                >
                  {attr.value}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-auto flex items-end justify-between pt-4">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Price
              </span>
              <span className="text-lg font-bold text-primary">
                EGP {formatNumber(product.price)}
              </span>
            </div>

            <AddToCartButton product={product} />
          </div>
        </div>
      </Card>
    </Link>
  );
}