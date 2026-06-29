"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Star } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import type { ProductListItem } from "@/lib/types";
import { useEffect, useState } from "react";

export function ProductCard({ product }: { product: ProductListItem }) {
    const { addItem } = useCart();
    const [added, setAdded] = useState(false);
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
    const selectedVariant = product.variants.find((v) => v.id === (selectedVariantId ?? product.variants[0]?.id)) ?? product.variants[0];
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
        const timeout = setTimeout(() => setAdded(false), 1500);
        return () => clearTimeout(timeout);
    }, [added]);

    return (
        <Card className="group flex h-full flex-col overflow-hidden border-border transition-shadow hover:shadow-md">
            <Link href={`/shop/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-secondary/40">
                <Image
                    src={product.images[0] ?? "/placeholder-product.png"}
                    alt={product.name}
                    fill
                    className="object-cover text-center transition-transform duration-300 group-hover:scale-105"

                />
                {product.brand && (
                    <Badge variant="secondary" className="absolute left-2 top-2 bg-card/90 text-foreground">
                        {product.brand.name}
                    </Badge>
                )}
                {outOfStock && (
                    <Badge variant="destructive" className="absolute right-2 top-2">
                        Out of stock
                    </Badge>
                )}
            </Link>

            <CardContent className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden px-4 pb-0 pt-3">
                <Link href={`/shop/${product.slug}`}>
                    <h3 className="line-clamp-2 text-sm font-medium text-foreground transition-colors hover:text-primary">
                        {product.name}
                    </h3>
                </Link>

                {product.description && (
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                        {product.description}
                    </p>
                )}

                {product.variants.length > 1 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                        {product.variants.slice(0, 4).map((v) => {
                            const isSelected = selectedVariant?.id === v.id;
                            const isOut = v.stock <= 0;
                            return (
                                <button
                                    key={v.id}
                                    type="button"
                                    disabled={isOut}
                                    onClick={() => setSelectedVariantId(v.id)}
                                    className={`cursor-pointer rounded-md border px-1.5 py-0.5 text-[10px] transition-colors ${isSelected ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-foreground/30"} ${isOut ? "cursor-not-allowed opacity-40" : ""}`}
                                >
                                    {v.name}
                                </button>
                            );
                        })}
                        {product.variantCount > 4 && (
                            <span className="text-[10px] text-muted-foreground">
                                +{product.variantCount - 4}
                            </span>
                        )}
                    </div>
                )}

                {product.rating !== null && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        <span className="font-medium text-foreground">{product.rating}</span>
                        <span>({product.reviewCount})</span>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex items-center justify-between px-4 pb-4 pt-3">
                <div className="flex items-baseline gap-1">
                    <span className="text-sm font-semibold text-foreground">
                        {price.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">EGP</span>
                </div>
                <Button
                    size="sm"
                    disabled={outOfStock || !selectedVariant}
                    onClick={handleAddToCart}
                    className="cursor-pointer min-w-[100px]"
                >
                    <ShoppingCart className={`size-3.5 transition-all duration-300 ${added ? "scale-0 opacity-0" : ""}`} />
                    <span className="relative">
                        <span className={`transition-all duration-300 ${added ? "opacity-0" : ""}`}>
                            {outOfStock ? "Out of stock" : "Cart"}
                        </span>
                        <span className={`absolute inset-0 transition-all duration-300 ${added ? "opacity-100" : "opacity-0"}`}>
                            Added!
                        </span>
                    </span>
                </Button>
            </CardFooter>
        </Card>
    );
}