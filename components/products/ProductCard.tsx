"use client";

import Link from "next/link";
import Image from "next/image";
import { Check, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { formatNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type ProductAttribute = {
    typeName: string;
    value: string;
};

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
    const { addItem } = useCart();
    const [added, setAdded] = useState(false);

    const outOfStock = product.stock != null ? product.stock <= 0 : false;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (outOfStock) return;

        addItem({
            productId: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            image: product.images[0] ?? ""
        });
        setAdded(true);
    };

    useEffect(() => {
        if (!added) return;
        const t = setTimeout(() => setAdded(false), 1400);
        return () => clearTimeout(t);
    }, [added]);

    return (
        <Link href={`/shop/${product.slug}`} className="group block h-full">
            <Card className="flex h-full flex-col overflow-hidden rounded-lg border border-border/40 bg-card transition-transform duration-300 hover:-translate-y-0.5">
                {/* Image */}
                <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden border-b border-border/20 bg-background p-3">
                    <Image
                        src={product.images[0] ?? "/zz.svg"}
                        alt={product.name}
                        fill
                        priority={priority}
                        className="object-contain p-1 transition-transform duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 300px"
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
                            <Badge
                                variant="destructive"
                                className="rounded-md px-3 py-1 text-xs"
                            >
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

                    {/* Attribute badges */}
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

                        <button
                            type="button"
                            disabled={outOfStock}
                            onClick={handleAddToCart}
                            aria-label="Add to cart"
                            className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200",
                                added
                                    ? "bg-green-600 text-white"
                                    : "bg-primary text-primary-foreground hover:bg-primary/90",
                                "disabled:pointer-events-none disabled:opacity-40"
                            )}
                        >
                            {added ? (
                                <Check className="h-4 w-4" />
                            ) : (
                                <ShoppingBag className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>
            </Card>
        </Link>
    );
}