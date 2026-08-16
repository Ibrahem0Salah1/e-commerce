// components/products/AddToCartButton.tsx
"use client";

import { Minus, Plus, ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/useCart";
import type { ProductDetail } from "@/lib/types";
import { formatNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { useState, useEffect } from "react";

export function AddToCartButton({ product }: { product: ProductDetail }) {
  const { addItem, updateQuantity, items } = useCart();
  const [added, setAdded] = useState(false);

  // Check if this product is already in cart
  const cartItem = items.find((i) => i.productId === product.id);
  const cartQty = cartItem?.quantity ?? 0;

  // Local quantity selector state
  const [quantity, setQuantity] = useState(1);

  // Reset local quantity when cart changes (e.g. after add)
  useEffect(() => {
    setQuantity(1);
  }, [cartQty]);

  const stock = product.stock ?? 0;
  const outOfStock = stock <= 0;
  const remainingStock = Math.max(0, stock - cartQty);
  const atLimit = cartQty >= stock && stock > 0;

  // Stepper bounds
  const canDecrease = quantity > 1;
  const canIncrease = quantity < remainingStock;

  const handleDecrease = () => {
    if (canDecrease) setQuantity((q) => q - 1);
  };

  const handleIncrease = () => {
    if (canIncrease) setQuantity((q) => q + 1);
  };

  const handleAddToCart = () => {
    if (outOfStock || quantity > remainingStock) return;

    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.images[0] ?? "",
        stock, // ← guest validation needs this
      },
      quantity, // ← add all at once, not in a loop
    );

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleUpdateCart = (delta: number) => {
    const newQty = cartQty + delta;
    if (newQty <= 0) {
      // Let updateQuantity handle removal (quantity <= 0 removes item)
      updateQuantity(product.id, 0);
    } else if (newQty <= stock) {
      updateQuantity(product.id, newQty);
    }
  };

  const totalPrice = product.price * quantity;
  const inCartTotalPrice = product.price * cartQty;

  return (
    <div className="space-y-4">
      <Separator />

      {/* Stock status */}
      {outOfStock ? (
        <p className="text-sm font-medium text-destructive">Out of stock</p>
      ) : stock <= 3 ? (
        <p className="text-sm font-medium text-amber-600">
          Only {stock} left in stock
        </p>
      ) : null}

      {/* Already in cart indicator */}
      {cartQty > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-primary/5 px-4 py-2.5">
          <span className="text-sm text-primary font-medium">
            {cartQty} in cart
          </span>
          <span className="text-sm text-muted-foreground">
            EGP {formatNumber(inCartTotalPrice)}
          </span>
        </div>
      )}

      {/* Quantity stepper */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Quantity</p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 cursor-pointer"
            disabled={!canDecrease}
            onClick={handleDecrease}
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span
            data-testid="detail-quantity"
            className="flex h-9 w-14 items-center justify-center rounded-md border border-border text-sm tabular-nums font-medium"
          >
            {quantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 cursor-pointer"
            disabled={!canIncrease}
            onClick={handleIncrease}
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Total for this add action */}
      <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-xl font-bold text-foreground">
          {formatNumber(totalPrice)}
          <span className="ml-1 text-sm font-normal text-muted-foreground">EGP</span>
        </span>
      </div>

      {/* Main action button */}
      <Button
        size="lg"
        className={cn(
          "w-full cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]",
          added && "bg-green-600 hover:bg-green-700",
        )}
        disabled={outOfStock || quantity > remainingStock}
        onClick={handleAddToCart}
      >
        {added ? (
          <Check className="mr-2 h-5 w-5 animate-in zoom-in duration-200" />
        ) : (
          <ShoppingCart className="mr-2 h-5 w-5" />
        )}
        <span className="relative">
          <span
            className={cn(
              "transition-all duration-200",
              added && "opacity-0",
            )}
          >
            {outOfStock
              ? "Out of stock"
              : atLimit
                ? "Maximum reached"
                : cartQty > 0
                  ? `Add ${quantity} more to cart`
                  : "Add to cart"}
          </span>
          {added && (
            <span className="absolute inset-0 flex items-center justify-center animate-in fade-in duration-200">
              Added to cart!
            </span>
          )}
        </span>
      </Button>

      {/* Quick +/- if already in cart */}
      {cartQty > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Or update cart:</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleUpdateCart(-1)}
              disabled={cartQty <= 0}
              aria-label="Update cart decrease"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-6 text-center font-medium text-foreground">
              {cartQty}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleUpdateCart(1)}
              disabled={cartQty >= stock}
              aria-label="Update cart increase"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}