"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Star, Check, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

import { useCart } from "@/hooks/useCart";
import type { ProductListItem } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function ProductCard({
    product,
}: {
    product: ProductListItem;
}) {
    const { addItem } = useCart();

    const [added, setAdded] = useState(false);
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
        null
    );

    const selectedVariant =
        product.variants.find(
            (v) => v.id === (selectedVariantId ?? product.variants[0]?.id)
        ) ?? product.variants[0];

    const price = selectedVariant?.price ?? product.basePrice;

    const outOfStock = selectedVariant
        ? selectedVariant.stock <= 0
        : false;

    const description =
        product.description && product.description.length > 0
            ? product.description[0]
            : null;

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
        const timeout = setTimeout(() => setAdded(false), 1400);
        return () => clearTimeout(timeout);
    }, [added]);
    return (
        <Card className="group flex h-full w-full flex-col overflow-hidden rounded-lg border border-border/50 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
            {/* ---------------- Image ---------------- */}

            <Link
                href={`/shop/${product.slug}`}
                className="relative flex aspect-square items-center justify-center overflow-hidden border-b border-border/30 bg-background p-3"
            >
                <Image
                    src={product.images[0] ?? "/placeholder-product.png"}
                    alt={product.name}
                    fill
                    className="object-contain p-1 transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width:640px) 80vw,
                 (max-width:1024px) 40vw,
                 280px"
                />

                {product.brand && (
                    <Badge
                        variant="secondary"
                        className="absolute left-3 top-3 rounded-md px-2 py-1 text-[10px] font-medium"
                    >
                        {product.brand.name}
                    </Badge>
                )}

                {outOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/65 backdrop-blur-sm">
                        <Badge
                            variant="destructive"
                            className="rounded-md px-3 py-1 text-xs"
                        >
                            Out of Stock
                        </Badge>
                    </div>
                )}
            </Link>

            {/* ---------------- Content ---------------- */}

            <div className="flex flex-1 flex-col p-4">
                {/* Brand */}

                {product.brand && (
                    <span className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {product.brand.name}
                    </span>
                )}

                {/* Title */}

                <Link href={`/shop/${product.slug}`}>
                    <h3 className="line-clamp-2  text-[15px] font-semibold leading-5 text-foreground transition-colors group-hover:text-primary">
                        {product.name}
                    </h3>
                </Link>

                {/* Description */}

                {description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">
                        {description}
                    </p>
                )}
                {/* ---------------- Variants ---------------- */}

                {product.variants.length > 1 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {product.variants.slice(0, 4).map((variant) => {
                            const isSelected = selectedVariant?.id === variant.id;
                            const isOut = variant.stock <= 0;

                            return (
                                <button
                                    key={variant.id}
                                    type="button"
                                    disabled={isOut}
                                    onClick={() => setSelectedVariantId(variant.id)}
                                    className={cn(
                                        "rounded-md border px-2 py-1 text-[11px] font-medium transition-all duration-200",
                                        isSelected
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                                        isOut && "cursor-not-allowed opacity-40"
                                    )}
                                >
                                    {variant.name}
                                </button>
                            );
                        })}

                        {product.variantCount > 4 && (
                            <Badge
                                variant="secondary"
                                className="rounded-md px-2 py-1 text-[11px]"
                            >
                                +{product.variantCount - 4}
                            </Badge>
                        )}
                    </div>
                )}

                {/* ---------------- Rating ---------------- */}

                <div className="mt-3 flex items-center gap-1.5">
                    {product.rating !== null ? (
                        <>
                            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />

                            <span className="text-sm font-medium text-foreground">
                                {Number(product.rating).toFixed(1)}
                            </span>

                            <span className="text-sm text-muted-foreground">
                                ({product.reviewCount})
                            </span>
                        </>
                    ) : (
                        <span className="text-xs italic text-muted-foreground">
                            No reviews yet
                        </span>
                    )}
                </div>

                {/* Push footer down */}

                <div className="mt-auto" />

                {/* ---------------- Footer ---------------- */}

                <div className="mt-4 flex items-end justify-between pt-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Price
                        </span>

                        <span className="text-[16px] font-bold text-primary">
                            EGP {formatNumber(price)}
                        </span>
                    </div>

                    <button
                        type="button"
                        disabled={!selectedVariant || outOfStock}
                        onClick={handleAddToCart}
                        className={cn(
                            "flex p-2 items-center justify-center rounded-full transition-all duration-300",
                            added
                                ? "bg-green-600 text-white"
                                : "bg-primary/90 text-primary-foreground hover:bg-primary",
                            "disabled:pointer-events-none disabled:opacity-40 active:scale-95"
                        )}
                    >
                        {added ? (
                            <Check className="h-4.5 w-4.5" />
                        ) : (

                            <ShoppingBag className="h-4.5 w-4.5 rounded font-medium" />
                        )}
                    </button>
                </div>
            </div>
        </Card>
    );
}