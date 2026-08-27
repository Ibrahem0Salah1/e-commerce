"use client";

import Image from "next/image";
import { Package } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";
import type { ShippingMethodOption } from "@/lib/orders/types";
import type { CartItem } from "@/lib/types";

type Props = {
  items: CartItem[];
  totalPrice: number;
  selectedMethod: ShippingMethodOption | null;
};

export function OrderSummary({ items, totalPrice, selectedMethod }: Props) {
  const shippingFee = selectedMethod ? selectedMethod.price : 0;
  const grandTotal = totalPrice + shippingFee;

  return (
    <div className="rounded-lg lg:sticky lg:top-24">
      <p className="text-[11px] md:text-xs font-semibold uppercase tracking-wider">
        Order Summary
      </p>

      {/* Items */}
      <div className="mt-4 md:mt-5 space-y-3 md:space-y-4">
        {items.map((item) => (
          <div key={item.productId} className="flex items-center gap-2.5 md:gap-3">
            <div className="relative size-12 md:size-14 shrink-0">
              <div className="relative h-full w-full overflow-hidden rounded-sm">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
                ) : (
                  <Package className="absolute inset-0 m-auto h-4 w-4 md:h-5 md:w-5" />
                )}
              </div>
              <span className="absolute -right-1 -top-1 md:-right-1.5 md:-top-1.5 flex h-4 min-w-4 md:h-5 md:min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[9px] md:text-[10px] font-bold text-primary-foreground">
                {item.quantity}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs md:text-sm font-medium text-foreground">{item.name}</p>
              <p className="mt-0.5 text-[11px] md:text-xs text-muted-foreground tabular-nums">
                {formatNumber(item.price)} EGP
              </p>
            </div>

            <p className="text-xs md:text-sm font-medium tabular-nums text-foreground">
              {formatNumber(Number(item.price) * item.quantity)} EGP
            </p>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="mt-5 md:mt-6 space-y-1.5 md:space-y-2 border-t border-transparent pt-4 text-xs md:text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums text-foreground">{formatNumber(totalPrice)} EGP</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Shipping</span>
          <span className="tabular-nums text-foreground">
            {selectedMethod ? `${formatNumber(shippingFee)} EGP` : "—"}
          </span>
        </div>
        <div className="flex justify-between pt-2 text-sm md:text-base font-semibold text-foreground">
          <span>Total</span>
          <span className="tabular-nums">{formatNumber(grandTotal)} EGP</span>
        </div>
      </div>
    </div>
  );
}
