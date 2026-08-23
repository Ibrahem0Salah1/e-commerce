import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Phone,
  Banknote,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
import { getUserOrderDetailAction } from "@/lib/orders/actions";
import { formatNumber } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getUserOrderDetailAction(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Success Hero Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-10 w-10 animate-in zoom-in-50 duration-300" />
        </div>
        <Badge variant="outline" className="mb-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5">
          Order Confirmed
        </Badge>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Thank you for your order!
        </h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          Your procurement order <span className="font-semibold text-foreground">#{order.id.slice(-8).toUpperCase()}</span> has been placed and is currently being processed.
        </p>
      </div>

      <div className="mt-10 space-y-6">
        {/* COD Notice Box */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Banknote className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Cash on Delivery (COD) Payment
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Please prepare the exact amount of <span className="font-bold text-foreground">{formatNumber(order.total)} EGP</span> in cash or card to hand to the delivery courier upon arrival.
            </p>
          </div>
        </div>

        {/* Order Details Card */}
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="border-b border-border bg-muted/40 p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Order Reference</p>
              <p className="text-sm font-bold text-foreground">#{order.id.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Order Date</p>
              <p className="text-sm font-medium text-foreground">
                {new Date(order.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge variant="default" className="text-xs font-semibold">
                {order.status}
              </Badge>
            </div>
          </div>

          {/* Items List */}
          <div className="p-4 sm:p-6 space-y-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Ordered Supplies ({order.itemCount} units)
            </h4>

            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                      {item.product?.images?.[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground m-auto" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × {formatNumber(item.unitPrice)} EGP
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm font-bold text-foreground tabular-nums">
                    {formatNumber(item.totalPrice)} EGP
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Financial Breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums text-foreground">{formatNumber(order.subtotal)} EGP</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount</span>
                  <span className="tabular-nums">-{formatNumber(order.discountAmount)} EGP</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Fee</span>
                <span className="tabular-nums text-foreground">{formatNumber(order.shippingPrice)} EGP</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold text-foreground">
                <span>Total Amount (COD)</span>
                <span className="tabular-nums text-primary text-xl font-extrabold">
                  {formatNumber(order.total)} EGP
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Destination Info */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-xs">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" /> Delivery Destination
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">City / Governorate</p>
              <p className="font-semibold text-foreground">{order.shippingCity}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Payment Status</p>
              <p className="font-semibold text-foreground">
                {order.paymentStatus === "PAID" ? "Paid" : "Pending Collection upon Delivery"}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button asChild size="lg" className="w-full sm:w-auto gap-2">
            <Link href="/orders">
              <ShoppingBag className="h-4 w-4" /> View My Orders
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto gap-2">
            <Link href="/shop">
              Continue Shopping <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
