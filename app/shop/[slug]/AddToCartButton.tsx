"use client";

import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/useCart";
import type { ProductDetail } from "@/lib/types";
import { useState } from "react";

export function AddToCartButton({ product }: { product: ProductDetail }) {
  const { addItem } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants[0]?.id ?? "",
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const selectedVariant = product.variants.find(
    (v) => v.id === selectedVariantId,
  );
  const outOfStock = selectedVariant ? selectedVariant.stock <= 0 : true;
  const price = selectedVariant?.price ?? product.basePrice;

  const handleAddToCart = () => {
    if (!selectedVariant || outOfStock) return;
    for (let i = 0; i < quantity; i++) {
      addItem({
        variantId: selectedVariant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: selectedVariant.price,
        image: product.images[0] ?? "",
        variantName: selectedVariant.name,
      });
    }
    setAdded(true);
    setQuantity(1);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="space-y-4">
      {product.variants.length > 1 && (
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Variant</p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => {
                  setSelectedVariantId(variant.id);
                  setQuantity(1);
                }}
                disabled={variant.stock <= 0}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                  selectedVariantId === variant.id
                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                    : "border-border text-foreground hover:border-foreground/40"
                } ${variant.stock <= 0 ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
              >
                {variant.name}
                {variant.stock > 0 && variant.stock <= 5 && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    (only {variant.stock} left)
                  </span>
                )}
                {variant.stock <= 0 && (
                  <span className="ml-1.5 text-xs text-muted-foreground">Out of stock</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <Separator />

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Quantity</p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="cursor-pointer"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Minus />
          </Button>
          <span className="flex h-9 w-14 items-center justify-center rounded-md border border-border text-sm tabular-nums">
            {quantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="cursor-pointer"
            onClick={() => setQuantity((q) => q + 1)}
          >
            <Plus />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-xl font-bold text-foreground">
          {(price * quantity).toLocaleString()}
          <span className="ml-1 text-sm font-normal text-muted-foreground">EGP</span>
        </span>
      </div>

      <Button
        size="lg"
        className="w-full cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
        disabled={outOfStock || !selectedVariant}
        onClick={handleAddToCart}
      >
        <ShoppingCart
          className={`size-4 transition-all duration-300 ${added ? "scale-0 opacity-0" : ""}`}
        />
        <span className="relative">
          <span className={`transition-all duration-300 ${added ? "opacity-0" : ""}`}>
            {outOfStock ? "Out of stock" : "Add to cart"}
          </span>
          <span
            className={`absolute inset-0 transition-all duration-300 ${added ? "opacity-100" : "opacity-0"}`}
          >
            Added to cart!
          </span>
        </span>
      </Button>
    </div>
  );
}
