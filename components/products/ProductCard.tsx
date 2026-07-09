"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Star, Check } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import type { ProductListItem } from "@/lib/types";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/format";

export function ProductCard({ product }: { product: ProductListItem }) {
    const { addItem } = useCart();
    const [added, setAdded] = useState(false);
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
    const selectedVariant =
        product.variants.find((v) => v.id === (selectedVariantId ?? product.variants[0]?.id)) ??
        product.variants[0];
    const price = selectedVariant?.price ?? product.basePrice;
    const outOfStock = selectedVariant ? selectedVariant.stock <= 0 : false;

    const handleAddToCart = () => {
        if (!selectedVariant || outOfStock) return;
        addItem({
            variantId: selectedVariant.id,
            productId: product.id,
            slug: product.slug,
            name: product.name,
            price: Number(selectedVariant.price),
            image: product.images[0] ?? "",
            variantName: selectedVariant.name,
        });
        setAdded(true);
    };

    useEffect(() => {
        if (!added) return;
        const timeout = setTimeout(() => setAdded(false), 1800);
        return () => clearTimeout(timeout);
    }, [added]);

    return (
        <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow duration-200 hover:shadow-md">
            {/* ─── Image ─── */}
            <Link
                href={`/shop/${product.slug}`}
                className="relative block aspect-4/3 overflow-hidden bg-secondary/30"
            >
                <Image
                    src={product.images[0] ?? "/placeholder-product.png"}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                    sizes="(max-width: 639px) 50vw, (max-width: 1279px) 33vw, 25vw"
                />

                {/* Brand badge */}
                {product.brand && (
                    <span className="absolute left-2.5 top-2.5 inline-flex items-center rounded-md bg-card/80 px-2 py-0.5 text-[11px] font-medium text-foreground backdrop-blur-sm">
                        {product.brand.name}
                    </span>
                )}

                {/* Out of stock overlay */}
                {outOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
                        <span className="rounded-md bg-foreground/90 px-3 py-1 text-xs font-medium text-background">
                            Out of stock
                        </span>
                    </div>
                )}
            </Link>

            {/* ─── Content ─── */}
            <div className="flex flex-1 flex-col gap-2 px-4 pt-3.5 pb-0">
                {/* Name */}
                <Link href={`/shop/${product.slug}`}>
                    <h3 className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground transition-colors hover:text-primary">
                        {product.name}
                    </h3>
                </Link>

                {/* Description */}
                {product.description && (
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                        {product.description}
                    </p>
                )}

                {/* Variants */}
                {product.variants.length > 1 && (
                    <div className="flex flex-wrap gap-1">
                        {product.variants.slice(0, 4).map((v) => {
                            const isSelected = selectedVariant?.id === v.id;
                            const isOut = v.stock <= 0;
                            return (
                                <button
                                    key={v.id}
                                    type="button"
                                    disabled={isOut}
                                    onClick={() => setSelectedVariantId(v.id)}
                                    className={cn(
                                        "rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                                        isSelected
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                                        isOut && "cursor-not-allowed opacity-40"
                                    )}
                                >
                                    {v.name}
                                </button>
                            );
                        })}
                        {product.variantCount > 4 && (
                            <span className="py-0.5 text-[10px] text-muted-foreground">
                                +{product.variantCount - 4}
                            </span>
                        )}
                    </div>
                )}

                {/* Rating */}
                {product.rating !== null && (
                    <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        <span className="text-xs font-medium text-foreground">
                            {product.rating}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            ({product.reviewCount})
                        </span>
                    </div>
                )}

                {/* Spacer to push price/button to bottom */}
                <div className="flex-1" />
            </div>

            {/* ─── Footer: Price + CTA ─── */}
            <div className="flex items-center justify-between px-4 pt-2 pb-3.5">
                <div className="flex items-baseline gap-1">
                    <span className="text-base font-semibold tabular-nums text-foreground">
                        {formatNumber(price)}
                    </span>
                    <span className="text-xs text-muted-foreground">EGP</span>
                </div>

                <button
                    type="button"
                    disabled={outOfStock || !selectedVariant}
                    onClick={handleAddToCart}
                    className={cn(
                        "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-all duration-200",
                        added
                            ? "bg-green-600 text-white"
                            : "bg-primary text-primary-foreground hover:bg-primary/85",
                        "disabled:pointer-events-none disabled:opacity-40",
                        "active:scale-[0.97]"
                    )}
                >
                    <ShoppingCart
                        className={cn(
                            "size-3.5 transition-all duration-300",
                            added && "scale-0 opacity-0"
                        )}
                    />
                    <Check
                        className={cn(
                            "size-3.5 transition-all duration-300",
                            added ? "scale-100 opacity-100" : "scale-0 opacity-0"
                        )}
                    />
                    <span className="relative text-xs">
                        <span
                            className={cn(
                                "transition-all duration-300",
                                added ? "opacity-0" : "opacity-100"
                            )}
                        >
                            Add
                        </span>
                        <span
                            className={cn(
                                "absolute inset-0 transition-all duration-300",
                                added ? "opacity-100" : "opacity-0"
                            )}
                        >
                            Added
                        </span>
                    </span>
                </button>
            </div>
        </div>
    );
}
