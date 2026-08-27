"use client";

import { useState } from "react";
import Link from "next/link";
import { FormProvider } from "react-hook-form";
import { Lock, ShoppingCart, Package } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useCheckoutForm } from "@/hooks/useCheckoutForm";
import type { ShippingMethodOption } from "@/lib/orders/types";
import { Button } from "@/components/ui/button";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { CheckoutSkeleton } from "@/components/checkout/CheckoutSkeleton";
import { AuthModal } from "@/components/auth/AuthModal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatNumber } from "@/lib/utils/format";

type Props = {
  shippingMethods: ShippingMethodOption[];
};

export function CheckoutClient({ shippingMethods }: Props) {
  const {
    items,
    totalPrice,
    clearCart,
    isLoggedIn,
    isLoading: cartLoading,
    isMerging,
    hasPendingMerge,
  } = useCart();

  const checkout = useCheckoutForm({
    shippingMethods,
    cart: { items, clearCart, isMerging, hasPendingMerge },
  });

  /* ── Shared shell: every state renders inside this frame ── */
  const shell = (content: React.ReactNode) => (
    <div className="min-h-screen bg-background">
      <header className="border-b border-zinc-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="text-xl text-primary font-extrabold tracking-tight"
          >
            MDS
          </Link>
          <Link
            href="/cart"
            aria-label="Go to cart"
            className="text-foreground transition-colors hover:text-primary"
          >
            <ShoppingCart className="h-4.5 lg:h-5 w-4.5 lg:w-5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full">{content}</main>
    </div>
  );

  if (cartLoading) {
    return shell(<CheckoutSkeleton />);
  }

  if (!isLoggedIn) {
    return shell(<SignedOutState />);
  }

  if (items.length === 0) {
    return shell(
      <div className="mx-auto  py-16 text-center">
        <Package className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold text-foreground">
          Your cart is empty
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add items to your cart before checking out.
        </p>
        <Button asChild className="mt-6 w-full rounded-sm">
          <Link href="/shop">Browse Supplies</Link>
        </Button>
      </div>,
    );
  }

  return shell(
    <>
      {checkout.generalError && (
        <div className="mx-auto max-w-7xl px-4 py-3 text-sm text-destructive bg-destructive/10 rounded-sm mb-2">
          {checkout.generalError}
        </div>
      )}

      {/* ── Mobile only: Order Summary dropdown (bg-accent) ── */}
      <div className="lg:hidden bg-zinc-200 border-y  border-zinc-200">
        <Accordion type="single" collapsible>
          <AccordionItem value="order-summary" className="border-0">
            <AccordionTrigger className="px-4 md:px-6 py-3 hover:no-underline">
              <span className="flex w-full items-center justify-between text-sm">
                <span className="flex items-center  font-normal text-primary">
                  Order Summary
                </span>
                <span className="font-semibold tabular-nums">
                  {formatNumber(totalPrice + (checkout.selectedMethod?.price ?? 0))} EGP
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 bg-zinc-100 md:px-6 pb-4">
              <div className="pt-2">
                <OrderSummary items={items} totalPrice={totalPrice} selectedMethod={checkout.selectedMethod} />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <FormProvider {...checkout.form}>
        <form onSubmit={checkout.form.handleSubmit(checkout.onSubmit, checkout.onInvalid)}>
          <div className="grid grid-cols-1 lg:grid-cols-5">
            {/* ═══ LEFT: details + CTA ═══ */}
            <div className="space-y-6 md:space-y-8 lg:space-y-10 lg:col-span-3 px-4 md:px-6 lg:px-12 xl:px-36 py-8 md:py-10 lg:py-24">
              <CheckoutForm
                shippingMethods={shippingMethods}
                isPlacingOrder={checkout.isPlacingOrder}
                isMerging={isMerging}
                hasPendingMerge={hasPendingMerge}
              />
            </div>

            {/* ═══ RIGHT: summary — hidden on mobile, shown as dropdown above ═══ */}
            <aside className="hidden lg:block lg:col-span-2 px-4 md:px-6 lg:px-12 py-8 md:py-10 lg:py-24 bg-zinc-100">
              <OrderSummary items={items} totalPrice={totalPrice} selectedMethod={checkout.selectedMethod} />
            </aside>
          </div>
        </form>
      </FormProvider>
    </>,
  );
}

/* ── Signed-out state with in-place auth modal ── */
function SignedOutState() {
  const [authOpen, setAuthOpen] = useState(true);

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
      <h1 className="mt-4 text-xl font-semibold text-foreground">
        Sign in to checkout
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your cart is saved on this device and will be waiting for you after
        you sign in.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <Button onClick={() => setAuthOpen(true)} className="w-full rounded-sm">
          Sign In
        </Button>
        <Button asChild variant="ghost" className="w-full rounded-sm">
          <Link href="/cart">Back to Cart</Link>
        </Button>
      </div>

      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        // Land on the cart after any successful auth so the user can review
        // the merged/validated items, then proceed to checkout themselves.
        callbackUrl="/cart"
      />
    </div>
  );
}
