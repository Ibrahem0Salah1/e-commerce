"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils/cn";

interface AddToCartButtonProps {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    stock: number | null;
    images: string[];
  };
  /**
   * solid  — filled primary circle (product detail page)
   * overlay — transparent button with primary icon, floats on imagery
   */
  variant?: "solid" | "overlay";
  className?: string;
}

export function AddToCartButton({
  product,
  variant = "solid",
  className,
}: AddToCartButtonProps) {
  const { addItem, items } = useCart();
  const [added, setAdded] = useState(false);

  const cartItem = items.find((i) => i.productId === product.id);
  const cartQty = cartItem?.quantity ?? 0;
  const stock = product.stock ?? 0;
  const outOfStock = stock <= 0;
  const atLimit = cartQty >= stock && stock > 0;

  const handleAdd = (e: React.MouseEvent) => {
    // Prevent navigation when nested inside a product card <Link>
    e.preventDefault();
    e.stopPropagation();

    if (outOfStock || atLimit) return;

    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.images[0] ?? "",
        stock, // ← passed for guest validation
      },
      1,
    );

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <button
      type="button"
      data-testid="add-to-cart-btn"
      disabled={outOfStock || atLimit}
      onClick={handleAdd}
      aria-label="Add to cart"
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200",
        "disabled:pointer-events-none disabled:opacity-40",
        variant === "overlay"
          ? cn(
              "bg-transparent text-primary hover:bg-primary/10",
              added && "text-green-600",
            )
          : added
            ? "bg-green-600 text-white"
            : "bg-primary text-primary-foreground hover:bg-primary/90",
        className,
      )}
    >
      {added ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <ShoppingCart className="h-4 w-4" />
      )}
    </button>
  );
}
