// components/products/ProductCard.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
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

/**
 * Minimal product card: square image + name + price. Nothing else.
 * The add-to-cart icon sits right of the metadata, and the whole card is a
 * fixed-height flex column so every card in a grid row aligns — regardless
 * of whether a product name wraps to one line or two.
 */
export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductListItem;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/shop/${product.slug}`}
      data-testid="product-card"
      className="group flex h-full flex-col"
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-sm border border-border">
        <Image
          src={product.images[0] ?? "/zz.svg"}
          alt={product.name}
          fill
          priority={priority}
          sizes="100vw"
          className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>

      {/* Meta (left) + cart action (right) — mt-auto pins this row to the
          bottom edge of the stretched card, so every card in a grid row shares
          one baseline regardless of name length. */}
      <div className="mt-auto flex items-end justify-between gap-2 pt-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-medium leading-5 text-foreground">
            {product.name}
          </h3>
          <p className="mt-1 text-sm font-semibold text-primary">
            EGP {formatNumber(product.price)}
          </p>
        </div>

        <AddToCartButton
          product={product}
          variant="overlay"
          className="shrink-0"
        />
      </div>
    </Link>
  );
}
