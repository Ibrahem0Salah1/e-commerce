"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Truck,
  ShieldCheck,
  CreditCard,
  Banknote,
  MapPin,
  Phone,
  User,
  FileText,
  Lock,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Package,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { formatNumber } from "@/lib/utils/format";
import {
  checkoutFormSchema,
  type CheckoutFormFields,
} from "@/lib/validations";
import { createOrder, getShippingMethodsAction } from "@/lib/orders/actions";
import type { ShippingMethodOption } from "@/lib/orders/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, totalItems, clearCart, isLoggedIn, isLoading: cartLoading } = useCart();

  const [shippingMethods, setShippingMethods] = useState<ShippingMethodOption[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Single idempotency key generated once per checkout session
  const [idempotencyKey] = useState<string>(() => crypto.randomUUID());

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormFields>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      shippingMethodId: "",
      shippingName: "",
      shippingPhone: "",
      shippingAddress: "",
      shippingCity: "",
      shippingNotes: "",
    },
  });

  const selectedMethodId = watch("shippingMethodId");
  const selectedMethod = shippingMethods.find((m) => m.id === selectedMethodId);
  const shippingFee = selectedMethod ? selectedMethod.price : 0;
  const grandTotal = totalPrice + shippingFee;

  // Fetch shipping methods and auto-select first option
  useEffect(() => {
    async function loadShippingMethods() {
      try {
        setMethodsLoading(true);
        const data = await getShippingMethodsAction();
        setShippingMethods(data);
        if (data.length > 0) {
          setValue("shippingMethodId", data[0].id, { shouldValidate: true });
        }
      } catch (err) {
        console.error("Failed to load shipping methods:", err);
        toast.error("Could not load delivery options. Please refresh.");
      } finally {
        setMethodsLoading(false);
      }
    }
    loadShippingMethods();
  }, [setValue]);

  const onSubmit = async (formData: CheckoutFormFields) => {
    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    setIsPlacingOrder(true);
    setGeneralError(null);

    try {
      const payload = {
        idempotencyKey,
        items: items.map((i) => ({
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

        if (result.code === "OUT_OF_STOCK") {
          setGeneralError(result.error);
          toast.error("Item Out of Stock", {
            description: result.error,
          });
          return;
        }

        setGeneralError(result.error);
        toast.error("Checkout Failed", {
          description: result.error,
        });
        return;
      }

      // Success
      clearCart();
      toast.success("Order Placed Successfully!", {
        description: `Order reference #${result.orderId.slice(-8).toUpperCase()}`,
      });
      router.push(`/checkout/success/${result.orderId}`);
    } catch (err) {
      console.error("Unexpected checkout error:", err);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
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

  if (cartLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Preparing checkout...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Sign In Required
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please sign in to your medical account to securely finalize your clinical supplies procurement.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button asChild size="lg" className="w-full">
            <Link href="/auth/login?redirect=/checkout">Sign In to Checkout</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/cart">Return to Cart</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Package className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Your Cart is Empty
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add items to your cart from our catalog before checking out.
        </p>
        <Button asChild className="mt-6">
          <Link href="/shop">Browse Supplies</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button & Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <Link href="/cart">
            <ArrowLeft className="h-4 w-4" /> Back to Cart
          </Link>
        </Button>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span>Cart</span> &gt; <span className="text-primary font-semibold">Checkout</span> &gt; <span>Confirmation</span>
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Procurement Checkout
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your delivery details and confirm your Cash on Delivery order.
        </p>
      </div>

      {generalError && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">
            <p className="font-semibold">Unable to complete checkout</p>
            <p className="mt-0.5">{generalError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* ═══════════════════════════════════════════
              LEFT COLUMN: FORM SECTIONS (8 cols)
              ═══════════════════════════════════════════ */}
          <div className="space-y-8 lg:col-span-8">
            {/* 1. SHIPPING & CONTACT INFO */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                  1
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Delivery &amp; Contact Details
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Where should we deliver your clinical supplies?
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Recipient Full Name */}
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="shippingName" className="flex items-center gap-1.5 text-xs font-medium">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    Doctor / Recipient Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="shippingName"
                    placeholder="e.g. Dr. Ahmed Hassan"
                    disabled={isPlacingOrder}
                    {...register("shippingName")}
                  />
                  {errors.shippingName && (
                    <p className="text-xs text-destructive">{errors.shippingName.message}</p>
                  )}
                </div>

                {/* Egyptian Phone Number */}
                <div className="space-y-2 sm:col-span-1">
                  <Label htmlFor="shippingPhone" className="flex items-center gap-1.5 text-xs font-medium">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    Phone Number (Egypt) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="shippingPhone"
                    type="tel"
                    placeholder="01012345678"
                    disabled={isPlacingOrder}
                    {...register("shippingPhone")}
                  />
                  {errors.shippingPhone && (
                    <p className="text-xs text-destructive">{errors.shippingPhone.message}</p>
                  )}
                </div>

                {/* Governorate / City */}
                <div className="space-y-2 sm:col-span-1">
                  <Label htmlFor="shippingCity" className="flex items-center gap-1.5 text-xs font-medium">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    City / Governorate <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="shippingCity"
                    placeholder="e.g. Cairo / Nasr City"
                    disabled={isPlacingOrder}
                    {...register("shippingCity")}
                  />
                  {errors.shippingCity && (
                    <p className="text-xs text-destructive">{errors.shippingCity.message}</p>
                  )}
                </div>

                {/* Street Address / Clinic Info */}
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="shippingAddress" className="flex items-center gap-1.5 text-xs font-medium">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    Detailed Address (Clinic / Hospital / Building) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="shippingAddress"
                    placeholder="Building 12, Clinic 304, Al-Tayaran St."
                    disabled={isPlacingOrder}
                    {...register("shippingAddress")}
                  />
                  {errors.shippingAddress && (
                    <p className="text-xs text-destructive">{errors.shippingAddress.message}</p>
                  )}
                </div>

                {/* Delivery Notes */}
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="shippingNotes" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    Delivery Notes / Special Instructions (Optional)
                  </Label>
                  <Input
                    id="shippingNotes"
                    placeholder="e.g. Call before arrival, clinic closes at 8 PM"
                    disabled={isPlacingOrder}
                    {...register("shippingNotes")}
                  />
                  {errors.shippingNotes && (
                    <p className="text-xs text-destructive">{errors.shippingNotes.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 2. SHIPPING METHOD SELECTION */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                  2
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Shipping Method
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Select your delivery destination or clinic pickup preference.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                {methodsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : shippingMethods.length === 0 ? (
                  <p className="text-sm text-destructive">
                    No shipping methods available at the moment. Please contact support.
                  </p>
                ) : (
                  <Controller
                    control={control}
                    name="shippingMethodId"
                    render={({ field }) => (
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                      >
                        {shippingMethods.map((method) => {
                          const isSelected = field.value === method.id;
                          return (
                            <label
                              key={method.id}
                              htmlFor={`method-${method.id}`}
                              className={`relative flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                                isSelected
                                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                                  : "border-border bg-card hover:border-primary/50 hover:bg-muted/30"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <RadioGroupItem
                                  id={`method-${method.id}`}
                                  value={method.id}
                                />
                                <div>
                                  <span className="text-sm font-semibold text-foreground block">
                                    {method.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <Truck className="h-3 w-3" /> Standard Delivery
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-bold text-foreground tabular-nums">
                                  {formatNumber(method.price)} EGP
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </RadioGroup>
                    )}
                  />
                )}
                {errors.shippingMethodId && (
                  <p className="mt-2 text-xs text-destructive">
                    {errors.shippingMethodId.message}
                  </p>
                )}
              </div>
            </div>

            {/* 3. PAYMENT METHOD (COD) */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                  3
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Payment Method
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Cash on Delivery (COD) is the default payment option for this order.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-start gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Banknote className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-foreground">
                        Cash on Delivery (COD)
                      </h4>
                      <Badge variant="default" className="text-[10px] uppercase">
                        Recommended
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Pay safely upon delivery directly to the courier representative. You may inspect the packages before payment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════
              RIGHT COLUMN: ORDER SUMMARY (4 cols)
              ═══════════════════════════════════════════ */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24">
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
              <h3 className="text-base font-semibold text-foreground border-b border-border pb-3">
                Order Breakdown ({totalItems} {totalItems === 1 ? "item" : "items"})
              </h3>

              {/* Items List Preview */}
              <div className="mt-4 max-h-60 space-y-3 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3 text-sm">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground m-auto" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Qty: <span className="font-semibold text-foreground">{item.quantity}</span> × {formatNumber(item.price)} EGP
                      </p>
                    </div>
                    <div className="text-right text-xs font-semibold text-foreground tabular-nums">
                      {formatNumber(Number(item.price) * item.quantity)} EGP
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Calculations */}
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="tabular-nums text-foreground">
                    {formatNumber(totalPrice)} EGP
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping Fee</span>
                  <span className="tabular-nums text-foreground">
                    {selectedMethod ? `${formatNumber(shippingFee)} EGP` : "Select a method"}
                  </span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold text-foreground">Total to Pay</span>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-foreground tabular-nums">
                    {formatNumber(grandTotal)}
                  </span>
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    EGP (COD)
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="mt-6 w-full gap-2 text-base font-semibold cursor-pointer"
                disabled={isPlacingOrder || methodsLoading}
              >
                {isPlacingOrder ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Confirm &amp; Place Order
                  </>
                )}
              </Button>

              {/* Trust Badges */}
              <div className="mt-6 space-y-2.5 border-t border-border pt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  <span>100% Guaranteed Certified Dental Supplies</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary shrink-0" />
                  <span>Secure Procurement &amp; Stock Reservation</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}
