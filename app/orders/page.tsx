import React from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  ShoppingBag,
  Package,
  ChevronRight,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  Lock,
  Headphones,
  ArrowRight,
} from "lucide-react";
import { getUserOrdersAction } from "@/lib/orders/actions";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { formatNumber } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return (
        <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 gap-1">
          <Clock className="h-3 w-3" /> Pending
        </Badge>
      );
    case "CONFIRMED":
      return (
        <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/10 gap-1">
          <CheckCircle2 className="h-3 w-3" /> Confirmed
        </Badge>
      );
    case "SHIPPED":
      return (
        <Badge variant="outline" className="text-purple-600 dark:text-purple-400 border-purple-500/30 bg-purple-500/10 gap-1">
          <Truck className="h-3 w-3" /> Shipped
        </Badge>
      );
    case "DELIVERED":
      return (
        <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 gap-1">
          <CheckCircle2 className="h-3 w-3" /> Delivered
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge variant="outline" className="text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10 gap-1">
          <XCircle className="h-3 w-3" /> Cancelled
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export const dynamic = "force-dynamic";

export default async function CustomerOrdersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/auth/login?redirect=/orders");
  }

  let orders: Awaited<ReturnType<typeof getUserOrdersAction>> = [];
  try {
    orders = await getUserOrdersAction();
  } catch (e) {
    console.error("[orders] failed to load customer orders:", e);
    // bubble to error.tsx
    throw new Error("Failed to load your orders. Please try again.");
  }

  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const pendingCount = orders.filter((o) => o.status === "PENDING").length;
  const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;
  const totalUnits = orders.reduce((sum, o) => sum + o.itemCount, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Title — matches cart typography */}
      <div className="border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-foreground">My Orders</h1>
          <p className="mt-1 md:mt-1.5 text-xs md:text-sm text-muted-foreground">
            Track and manage your medical and dental supplies order history.
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="mx-auto max-w-7xl px-4 py-12 md:py-16 flex min-h-[40vh] md:min-h-[50vh] flex-col items-center justify-center gap-3 md:gap-4">
          <div className="flex size-14 md:size-16 items-center justify-center rounded-full bg-zinc-100">
            <ShoppingBag className="h-6 w-6 md:h-7 md:w-7 text-muted-foreground" />
          </div>
          <div className="text-center px-4">
            <h2 className="text-sm md:text-base font-semibold text-foreground">No orders placed yet</h2>
            <p className="mt-1 text-xs md:text-sm text-muted-foreground max-w-sm">
              When you place an order for clinical equipment or consumables, it will appear here.
            </p>
          </div>
          <Button asChild size="sm" className="rounded-sm mt-2 text-xs md:text-sm">
            <Link href="/shop">Browse Supplies Catalog</Link>
          </Button>
        </div>
      ) : (
        <div className="mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            {/* LEFT: orders list — lg:col-span-3 like cart */}
            <div className="lg:col-span-3 px-4 md:px-6 lg:pl-12 xl:pl-36 lg:pr-8 xl:pr-12 py-6 md:py-10">
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] md:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {orders.length} {orders.length === 1 ? "Order" : "Orders"} • {totalUnits} {totalUnits === 1 ? "unit" : "units"}
                  </p>
                  <span className="text-[11px] md:text-xs text-muted-foreground tabular-nums">
                    Total spent {formatNumber(totalSpent)} EGP
                  </span>
                </div>

                {/* Desktop header — mirrors cart */}
                <div className="hidden md:grid grid-cols-12 gap-4 pb-3 border-b border-zinc-100 text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  <div className="col-span-5">Order</div>
                  <div className="col-span-3">Items</div>
                  <div className="col-span-2 text-center">Status</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                <div className="space-y-3 md:space-y-0 md:divide-y md:divide-zinc-100 md:border md:border-zinc-100 md:rounded-sm md:bg-card md:overflow-hidden">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="group rounded-sm border border-zinc-100 bg-card p-4 md:p-0 md:rounded-none md:border-0 shadow-xs md:shadow-none transition-all hover:border-zinc-200 md:hover:bg-muted/30"
                    >
                      {/* Mobile layout */}
                      <div className="md:hidden space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-mono text-xs font-bold text-foreground">#{order.id.slice(-8).toUpperCase()}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {getStatusBadge(order.status)}
                          <Badge variant="outline" className="text-[11px] font-normal border-zinc-200">
                            {order.paymentStatus === "PAID" ? "Paid" : "COD (Unpaid)"}
                          </Badge>
                          <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">{order.shippingCity}</span>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto py-1">
                          {order.items.slice(0, 4).map((item) => (
                            <div key={item.id} className="relative size-12 shrink-0 overflow-hidden rounded-sm border border-zinc-100 bg-muted" title={item.productName}>
                              {item.product?.images?.[0] ? (
                                <Image src={item.product.images[0]} alt={item.productName} fill className="object-cover" sizes="48px" />
                              ) : (
                                <Package className="h-5 w-5 text-muted-foreground m-auto" />
                              )}
                            </div>
                          ))}
                          {order.items.length > 4 && (
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-sm border border-zinc-100 bg-muted text-xs font-semibold text-muted-foreground">
                              +{order.items.length - 4}
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                            {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                          <div>
                            <p className="text-[11px] text-muted-foreground">Total (COD)</p>
                            <p className="text-sm font-bold tabular-nums text-foreground">{formatNumber(order.total)} <span className="text-xs font-normal text-muted-foreground">EGP</span></p>
                          </div>
                          <Button asChild variant="outline" size="sm" className="rounded-sm gap-1 h-8 text-xs">
                            <Link href={`/checkout/success/${order.id}`}>
                              Details <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>

                      {/* Desktop layout */}
                      <div className="hidden md:grid grid-cols-12 gap-4 items-center p-4 lg:p-5">
                        <div className="col-span-5 min-w-0">
                          <Link href={`/checkout/success/${order.id}`} className="font-mono text-xs font-bold text-foreground hover:text-primary hover:underline underline-offset-2">
                            #{order.id.slice(-8).toUpperCase()}
                          </Link>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • {order.shippingCity}
                          </p>
                          <div className="mt-2 flex items-center gap-1.5">
                            {getStatusBadge(order.status)}
                          </div>
                        </div>
                        <div className="col-span-3 flex items-center gap-1.5 overflow-hidden">
                          {order.items.slice(0, 3).map((item) => (
                            <div key={item.id} className="relative size-8 lg:size-9 shrink-0 overflow-hidden rounded-sm border border-zinc-100 bg-muted" title={item.productName}>
                              {item.product?.images?.[0] ? (
                                <Image src={item.product.images[0]} alt={item.productName} fill className="object-cover" sizes="36px" />
                              ) : (
                                <Package className="h-4 w-4 text-muted-foreground m-auto" />
                              )}
                            </div>
                          ))}
                          {order.items.length > 3 && <span className="text-[11px] font-medium text-muted-foreground">+{order.items.length - 3}</span>}
                          <span className="ml-2 text-xs text-muted-foreground tabular-nums">{order.itemCount} items</span>
                        </div>
                        <div className="col-span-2 flex flex-col items-center gap-1">
                          <Badge variant="outline" className="text-[11px] font-normal border-zinc-200">
                            {order.paymentStatus === "PAID" ? "Paid" : "COD (Unpaid)"}
                          </Badge>
                        </div>
                        <div className="col-span-2 text-right">
                          <p className="text-sm font-bold tabular-nums text-foreground">{formatNumber(order.total)} <span className="text-xs font-normal text-muted-foreground">EGP</span></p>
                          <Button asChild variant="outline" size="sm" className="mt-2 rounded-sm gap-1 h-7 text-xs">
                            <Link href={`/checkout/success/${order.id}`}>
                              Details <ChevronRight className="h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: summary — bg-zinc-100 like cart */}
            <aside className="lg:col-span-2 px-4 md:px-6 lg:px-12 py-6 md:py-10 bg-zinc-100 lg:min-h-[calc(100vh-140px)]">
              <div className="lg:sticky lg:top-24 space-y-4 md:space-y-6">
                <div>
                  <p className="text-[11px] md:text-xs font-semibold uppercase tracking-wider">Orders Summary</p>
                  <div className="mt-4 md:mt-5 space-y-2 md:space-y-2.5 text-xs md:text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Total Orders</span>
                      <span className="tabular-nums text-foreground font-medium">{orders.length}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Total Units</span>
                      <span className="tabular-nums text-foreground">{totalUnits}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Pending</span>
                      <span className="tabular-nums text-foreground">{pendingCount}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivered</span>
                      <span className="tabular-nums text-foreground">{deliveredCount}</span>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-5 flex justify-between items-center border-t border-zinc-200 pt-3 md:pt-4">
                    <span className="text-sm md:text-base font-semibold text-foreground">Total Spent</span>
                    <span className="text-lg md:text-xl font-bold tabular-nums text-foreground">
                      {formatNumber(totalSpent)}
                      <span className="ml-1 text-xs md:text-sm font-normal text-muted-foreground">EGP</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 md:space-y-3">
                  <Button asChild size="lg" className="w-full bg-accent-foreground rounded-sm gap-2 h-11 md:h-12 text-sm md:text-base">
                    <Link href="/shop">
                      Continue Shopping <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <p className="text-[11px] md:text-xs text-muted-foreground text-center">Need help with an order? Contact support.</p>
                  <Button asChild variant="outline" size="sm" className="w-full rounded-sm bg-white text-xs md:text-sm h-8 md:h-9">
                    <Link href="/cart">View Cart</Link>
                  </Button>
                </div>

                {/* Trust */}
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

                {/* Support */}
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
    </div>
  );
}
