import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProductListItem } from "@/lib/types";

export function ProductCard({ product }: { product: ProductListItem }) {
    const price = product.variants[0]?.price ?? product.basePrice;
    const outOfStock = product.variants[0] ? product.variants[0].stock <= 0 : false;

    return (
        <Card className="group flex h-full flex-col overflow-hidden border-border transition-shadow hover:shadow-md">
            <Link href={`/shop/${product.slug}`} className="relative block aspect-square overflow-hidden bg-secondary/40">
                <Image
                    src={product.images[0] ?? "/placeholder-product.png"}
                    alt={product.name}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 25vw"
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

            <CardContent className="flex flex-1 flex-col gap-1.5 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {product.category.name}
                </p>
                <Link href={`/shop/${product.slug}`}>
                    <h3 className="line-clamp-2 text-sm font-medium text-foreground transition-colors hover:text-primary">
                        {product.name}
                    </h3>
                </Link>

                {product.rating !== null ? (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                        <span className="font-medium text-foreground">{product.rating}</span>
                        <span>({product.reviewCount})</span>
                    </div>
                ) : (
                    <div className="h-[18px]" />
                )}
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t border-border p-4 pt-3">
                <div>
                    {product.variantCount > 1 && (
                        <span className="text-xs text-muted-foreground">From </span>
                    )}
                    <span className="text-base font-semibold text-foreground">
                        {price.toLocaleString()}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">EGP</span>
                    </span>
                </div>
                <Button size="sm" asChild>
                    <Link href={`/shop/${product.slug}`}>View</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}