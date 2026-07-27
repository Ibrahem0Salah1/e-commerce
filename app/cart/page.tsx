"use client";

import Link from "next/link";
import { ShoppingBag, ShieldCheck, Lock, Headphones, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CartCard } from "@/components/cart/CartCard";
import { useCart } from "@/hooks/useCart";
import { formatNumber } from "@/lib/utils/format";

export default function CartPage() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, isLoading } = useCart();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Page Header ── */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Procurement Cart
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Review your selected items before proceeding to checkout.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
          <div className="flex size-20 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-medium text-foreground">
              Your procurement cart is empty
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse our catalog to add medical and dental supplies to your order.
            </p>
          </div>
          <Button asChild className="mt-2">
            <Link href="/shop">Return to Catalog</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* ═══════════════════════════════════════════
              CART ITEMS
              ═══════════════════════════════════════════ */}
          <div className="w-full lg:w-2/3 flex flex-col gap-3">
            {/* Table Header (Desktop) */}
            <div className="hidden md:grid grid-cols-12 gap-4 pb-3 border-b border-border text-xs text-muted-foreground uppercase tracking-wider font-medium">
              <div className="col-span-6">Product Item &amp; Details</div>
              <div className="col-span-2 text-center">Unit Price</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-right">Subtotal</div>
            </div>

            {items.map((item) => (
              <CartCard
                key={item.productId}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>

          {/* ═══════════════════════════════════════════
              ORDER SUMMARY
              ═══════════════════════════════════════════ */}
          <aside className="w-full lg:w-1/3 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4">
              <h2 className="text-base font-semibold text-foreground border-b border-border pb-3">
                Order Summary
              </h2>

              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>
                    Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"})
                  </span>
                  <span className="tabular-nums text-foreground">
                    {formatNumber(totalPrice)} EGP
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span className="flex items-center gap-1">
                    Estimated Shipping
                    <Info
                      className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help"
                    />
                  </span>
                  <span className="tabular-nums text-foreground">
                    Calculated at checkout
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (Calculated at checkout)</span>
                  <span className="tabular-nums text-foreground">--</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-base font-semibold text-foreground">
                  Total
                </span>
                <span className="text-xl font-bold text-foreground tabular-nums">
                  {formatNumber(totalPrice)}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    EGP
                  </span>
                </span>
              </div>

              <Button asChild size="lg" className="w-full">
                <Link
                  href="/checkout"
                  className="flex items-center justify-center gap-2"
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/shop">Continue Shopping</Link>
              </Button>

              {/* Trust Signals */}
              <div className="mt-2 flex flex-col gap-3 pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    FDA Registered Facility Procurement
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Lock className="h-4 w-4" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Secure Clinical Transaction Processing
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Support */}
            <div className="mt-4 p-4 border border-border rounded-xl bg-muted/30 flex items-start gap-3">
              <Headphones className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-foreground">
                  Need assistance?
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Contact your dedicated account manager at 1-800-MDS-PROC.
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}