"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CartCard } from "@/components/cart/CartCard";
import { useCart } from "@/hooks/useCart";
import { formatNumber } from "@/lib/utils/format";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, isLoading } = useCart();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="cursor-pointer"
          onClick={() => router.back()}
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
            Shopping Cart
          </h1>
          {totalItems > 0 && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </p>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
          <div className="flex size-20 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-medium text-foreground">
              Your cart is empty
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Looks like you haven&apos;t added anything yet.
            </p>
          </div>
          <Button asChild className="mt-2 cursor-pointer">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <section className="space-y-3">
            {items.map((item) => (
              <CartCard
                key={item.variantId}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </section>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-base font-semibold text-foreground">
                Order Summary
              </h2>
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"})</span>
                  <span className="tabular-nums">{formatNumber(totalPrice)} EGP</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="tabular-nums">Calculated at checkout</span>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-foreground">
                  Total
                </span>
                <span className="text-lg font-bold tabular-nums">
                  {formatNumber(totalPrice)}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    EGP
                  </span>
                </span>
              </div>
              <Button asChild size="lg" className="mt-5 w-full cursor-pointer">
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="mt-3 w-full cursor-pointer"
              >
                <Link href="/shop">Continue Shopping</Link>
              </Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
