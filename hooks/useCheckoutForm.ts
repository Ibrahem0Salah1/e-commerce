"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  checkoutFormSchema,
  type CheckoutFormFields,
} from "@/lib/validations";
import { createOrder } from "@/lib/orders/actions";
import type { ShippingMethodOption } from "@/lib/orders/types";
import type { CartItem } from "@/lib/types";
import type { useCart } from "@/hooks/useCart";

/** The slice of the cart state the checkout form needs. */
export type CheckoutCart = Pick<
  ReturnType<typeof useCart>,
  "items" | "clearCart" | "isMerging" | "hasPendingMerge"
>;

type Props = {
  shippingMethods: ShippingMethodOption[];
  cart: CheckoutCart;
};

export function useCheckoutForm({ shippingMethods, cart }: Props) {
  const router = useRouter();

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Single idempotency key generated once per checkout session
  const [idempotencyKey] = useState<string>(() => crypto.randomUUID());

  const form = useForm<CheckoutFormFields>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      shippingMethodId: shippingMethods[0]?.id ?? "",
      shippingName: "",
      shippingPhone: "",
      shippingAddress: "",
      shippingCity: "",
      shippingNotes: "",
    },
  });

  const selectedMethodId = form.watch("shippingMethodId");
  const selectedMethod =
    shippingMethods.find((m) => m.id === selectedMethodId) ?? null;

  const onSubmit: SubmitHandler<CheckoutFormFields> = async (formData) => {
    if (cart.items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    // Never place an order while the guest→account merge is still in flight:
    // the order is built from the DB cart, and unmerged local items would be
    // missing from it (the exact "silent drop" this guard exists to prevent).
    if (cart.isMerging) {
      toast.error("Still syncing your cart", {
        description:
          "One moment — finishing your cart sync. Try again in a second.",
      });
      return;
    }
    if (cart.hasPendingMerge) {
      toast.error("Some saved items aren't synced yet", {
        description: "Review your cart page to retry or discard them first.",
      });
      return;
    }

    setIsPlacingOrder(true);
    setGeneralError(null);

    try {
      const payload = {
        idempotencyKey,
        items: cart.items.map((i: CartItem) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        shippingMethodId: formData.shippingMethodId,
        shippingName: formData.shippingName,
        shippingPhone: formData.shippingPhone,
        shippingAddress: formData.shippingAddress,
        shippingCity: formData.shippingCity,
        shippingNotes: formData.shippingNotes || undefined,
      };

      const result = await createOrder(payload);

      if (!result.success) {
        if (result.code === "AUTH") {
          toast.error("Session expired. Please sign in again.");
          router.push(`/auth/login?redirect=/checkout`);
          return;
        }

        setGeneralError(result.error);
        toast.error(
          result.code === "OUT_OF_STOCK" ? "Item Out of Stock" : "Checkout Failed",
          { description: result.error },
        );
        return;
      }

      // Success
      cart.clearCart();
      toast.success("Order Placed Successfully!", {
        description: `Order reference #${result.orderId.slice(-8).toUpperCase()}`,
      });
      router.push(`/checkout/success/${result.orderId}`);
    } catch (err) {
      console.error("Unexpected checkout error:", err);
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setGeneralError(msg);
      toast.error("Checkout Error", { description: msg });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const onInvalid = (formErrors: Record<string, { message?: string }>) => {
    const errorEntries = Object.entries(formErrors);
    if (errorEntries.length > 0) {
      const [field, err] = errorEntries[0];
      const message = err?.message || "Please complete all required fields.";
      toast.error("Please check your form details", {
        description: String(message),
      });
      const el = document.getElementById(field);
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  return {
    form,
    selectedMethod,
    isPlacingOrder,
    generalError,
    onSubmit,
    onInvalid,
  };
}
