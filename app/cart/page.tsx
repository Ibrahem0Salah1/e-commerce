"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShoppingBag, ShieldCheck, Lock, Headphones, ArrowRight, Info, LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartCard } from "@/components/cart/CartCard";
import { CartSkeleton } from "@/components/cart/CartSkeleton";
import { PendingMergeBanner } from "@/components/cart/PendingMergeBanner";
import { useCart } from "@/hooks/useCart";
import { formatNumber } from "@/lib/utils/format";
import { AuthModal } from "@/components/auth/AuthModal";

export default function CartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, totalItems, totalPrice, updateQuantity, removeItem, isLoggedIn, isLoading, isMerging } = useCart();

  const [authOpen, setAuthOpen] = useState(false);
  const showSignInPrompt = !isLoading && !isLoggedIn;

  // Only auto-open the modal when the user landed here via a checkout
  // intent (proxy redirect `?auth=1` or explicit intent param). A plain
  // guest visit to /cart shows only the banner + Sign In button.
  useEffect(() => {
    const wantsAuth = searchParams.get("auth") === "1";
    if (wantsAuth && showSignInPrompt) {
      setAuthOpen(true);
      // Clean the URL so a later refresh doesn't re-pop the modal.
      router.replace("/cart");
    }
  }, [searchParams, showSignInPrompt, router]);

  const handleProceedToCheckout = () => {
    if (!isLoggedIn) {
      setAuthOpen(true);
      return;
    }
    if (isMerging) return;
    router.push("/checkout");
  };

  const isSyncingCart = isMerging;

  // Unified skeleton for both initial cart fetch (isLoading) and guest→account
  // merge (isMerging). This prevents the empty-state flash:
  //   isLoggedIn flips → items = [] (queryData empty) → spinner → items refetched.
  // File `app/cart/loading.tsx` can't run because this page is "use client",
  // so we render a separate skeleton component that mimics the full UI.
  const showCartSkeleton = isLoading || isSyncingCart;
  if (showCartSkeleton) {
    return (
      <>
        <CartSkeleton isMerging={isMerging} />
        <AuthModal open={authOpen} onOpenChange={setAuthOpen} callbackUrl="/cart" />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Title — minimal, matches checkout typography */}
      <div className="border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-foreground">Procurement Cart</h1>
          <p className="mt-1 md:mt-1.5 text-xs md:text-sm text-muted-foreground">
            Review your selected items before checkout.
          </p>
        </div>
      </div>

      {showSignInPrompt && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-3 md:mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-3 rounded-sm bg-muted/60 px-3 md:px-4 py-2.5 md:py-3">
            <p className="flex items-center gap-2 text-xs md:text-sm text-foreground">
              <Lock className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
              Sign in to sync this cart — your items will be waiting after checkout.
            </p>
            <Button size="sm" className="rounded-sm gap-2 text-xs md:text-sm h-8 md:h-9" onClick={() => setAuthOpen(true)}>
              <LogIn className="h-3.5 w-3.5 md:h-4 md:w-4" />
              Sign In
            </Button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="mx-auto max-w-7xl px-4 py-12 md:py-16 flex min-h-[40vh] md:min-h-[50vh] flex-col items-center justify-center gap-3 md:gap-4">
          <div className="flex size-14 md:size-16 items-center justify-center rounded-full bg-zinc-100">
            <ShoppingBag className="h-6 w-6 md:h-7 md:w-7 text-muted-foreground" />
          </div>
          <div className="text-center px-4">
            <h2 className="text-sm md:text-base font-semibold text-foreground">Your procurement cart is empty</h2>
            <p className="mt-1 text-xs md:text-sm text-muted-foreground">Browse our catalog to add medical and dental supplies.</p>
          </div>
          <Button asChild size="sm" className="rounded-sm mt-2 text-xs md:text-sm">
            <Link href="/shop">Return to Catalog</Link>
          </Button>
        </div>
      ) : (
        <div className="mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            {/* ═══ LEFT: items — lg:col-span-3 like checkout ═══ */}
            <div className="lg:col-span-3 px-4 md:px-6 lg:pl-12 xl:pl-36 lg:pr-8 xl:pr-12 py-6 md:py-10">
              <div className="space-y-4 md:space-y-6">
                <PendingMergeBanner />
                <div className="flex items-center justify-between">
                  <p className="text-[11px] md:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {totalItems} {totalItems === 1 ? "Item" : "Items"}
                  </p>
                  <span className="text-[11px] md:text-xs text-muted-foreground tabular-nums">{totalItems} units</span>
                </div>

                <div className="hidden md:grid grid-cols-12 gap-4 pb-3 border-b border-zinc-100 text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  <div className="col-span-6">Product</div>
                  <div className="col-span-2 text-center">Price</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                <div className="divide-y divide-zinc-100">
                  {items.map((item) => (
                    <CartCard
                      key={item.productId}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* ═══ RIGHT: summary — bg-zinc-100 like checkout ═══ */}
            <aside className="lg:col-span-2 px-4 md:px-6 lg:px-12 py-6 md:py-10 bg-zinc-100 lg:min-h-[calc(100vh-140px)]">
              <div className="lg:sticky lg:top-24 space-y-4 md:space-y-6">
                <div>
                  <p className="text-[11px] md:text-xs font-semibold uppercase tracking-wider">Order Summary</p>
                  <div className="mt-4 md:mt-5 space-y-2 md:space-y-2.5 text-xs md:text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal ({totalItems})</span>
                      <span className="tabular-nums text-foreground">{formatNumber(totalPrice)} EGP</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground gap-2">
                      <span className="flex items-center gap-1">
                        Estimated Shipping
                        <Info className="h-3 w-3 md:h-3.5 md:w-3.5 opacity-60" />
                      </span>
                      <span className="tabular-nums text-foreground text-right text-xs md:text-sm">Calculated at checkout</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tax</span>
                      <span className="tabular-nums text-foreground">--</span>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-5 flex justify-between items-center border-t border-zinc-200 pt-3 md:pt-4">
                    <span className="text-sm md:text-base font-semibold text-foreground">Total</span>
                    <span className="text-lg md:text-xl font-bold tabular-nums text-foreground">
                      {formatNumber(totalPrice)}
                      <span className="ml-1 text-xs md:text-sm font-normal text-muted-foreground">EGP</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 md:space-y-3">
                  <Button
                    size="lg"
                    className="w-full bg-accent-foreground cursor-pointer rounded-sm gap-2 h-11 md:h-12 text-sm md:text-base"
                    onClick={handleProceedToCheckout}
                    disabled={isSyncingCart}
                  >
                    {isSyncingCart ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Syncing cart…
                      </>
                    ) : (
                      <>
                        Proceed to Checkout
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                  {!isLoggedIn && (
                    <p className="text-[11px] md:text-xs text-muted-foreground text-center">
                      You’ll be asked to sign in — your cart stays saved.
                    </p>
                  )}
                  <Button asChild variant="outline" size="sm" className="w-full rounded-sm bg-white text-xs md:text-sm h-8 md:h-9">
                    <Link href="/shop">Continue Shopping</Link>
                  </Button>
                </div>

                {/* Trust — flat, no card border */}
                <div className="pt-3 md:pt-4 border-t border-zinc-200 space-y-2.5 md:space-y-3">
                  <div className="flex items-center gap-2.5 md:gap-3 text-[11px] md:text-xs text-muted-foreground">
                    <div className="flex size-6 md:size-7 items-center justify-center rounded-sm bg-white text-primary">
                      <ShieldCheck className="h-3 w-3 md:h-3.5 md:w-3.5" />
                    </div>
                    FDA Registered Facility Procurement
                  </div>
                  <div className="flex items-center gap-2.5 md:gap-3 text-[11px] md:text-xs text-muted-foreground">
                    <div className="flex size-6 md:size-7 items-center justify-center rounded-sm bg-white text-primary">
                      <Lock className="h-3 w-3 md:h-3.5 md:w-3.5" />
                    </div>
                    Secure Clinical Transaction
                  </div>
                </div>

                {/* Support — white card, small radius */}
                <div className="flex items-start gap-2.5 md:gap-3 rounded-sm bg-white px-3 md:px-4 py-3 md:py-4">
                  <Headphones className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs md:text-sm font-medium text-foreground">Need assistance?</h4>
                    <p className="text-[11px] md:text-xs text-muted-foreground mt-1">
                      Contact your dedicated manager at 1-800-MDS-PROC.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} callbackUrl="/cart" />
    </div>
  );
}