"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "@/hooks/useCart";
import { formatNumber } from "@/lib/utils/format";

export function CartButton() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } =
    useCart();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-secondary cursor-pointer"
        >
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
              {totalItems > 99 ? "99+" : totalItems}
            </span>
          )}
        </Button>
      </SheetTrigger>

      {/* Full width on mobile, fixed width on desktop */}
      <SheetContent
        side="right"
        className="flex flex-col min-w-full sm:min-w-100 p-0 gap-0"
      >
        {/* ── Header ── */}
        <SheetHeader className="px-5 py-4 border-b border-border space-y-0">
          <SheetTitle className="text-left text-base font-semibold tracking-tight">
            Shopping Cart
            {totalItems > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({totalItems})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ShoppingCart className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Your cart is empty
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add medical supplies to get started.
              </p>
            </div>
            <SheetClose asChild>
              <Button asChild variant="outline" size="sm" className="rounded-sm">
                <Link href="/shop">Browse Products</Link>
              </Button>
            </SheetClose>
          </div>
        ) : (
          <>
            {/* ── Sub-header: count + clear all ──
                 Placed below the title so it never overlaps the sheet's X close button */}
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {totalItems} {totalItems === 1 ? "Item" : "Items"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="h-7 gap-1.5 rounded-sm px-2 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear all
              </Button>
            </div>

            {/* ── Items ── */}
            <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-3">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-3 rounded border border-border/60 bg-card p-3"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-muted">
                    <Image
                      src={item.image || "/placeholder-product.png"}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <Link
                      href={`/shop/${item.slug}`}
                      className="text-sm font-medium text-foreground transition-colors hover:text-primary line-clamp-1"
                    >
                      {item.name}
                    </Link>

                    <div className="flex items-center justify-between mt-2">
                      {/* Stepper */}
                      <div className="flex items-center border border-border rounded-sm h-7">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          className="flex h-full w-7 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1)
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="flex h-full w-8 items-center justify-center text-xs font-medium tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          className="flex h-full w-7 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1)
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold tabular-nums">
                          {formatNumber(item.price * item.quantity)}
                          <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                            EGP
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="p-1 text-muted-foreground transition-colors hover:text-destructive"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Footer ── */}
            <SheetFooter className="mt-auto border-t border-border px-5 py-4 flex-col gap-4">
              <div className="flex w-full items-center justify-between">
                <span className="text-sm font-medium text-foreground">Total</span>
                <span className="text-xl font-bold tabular-nums text-foreground">
                  {formatNumber(totalPrice)}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    EGP
                  </span>
                </span>
              </div>

              <div className="flex w-full flex-col gap-2">
                <SheetClose asChild>
                  <Button asChild size="lg" className="w-full rounded-sm">
                    <Link href="/checkout">Checkout</Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full rounded-sm"
                  >
                    <Link href="/cart">View Cart</Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}