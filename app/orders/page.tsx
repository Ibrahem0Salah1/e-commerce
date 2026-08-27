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

export default async function CustomerOrdersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/auth/login?redirect=/orders");
  }

  const orders = await getUserOrdersAction();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          My Procurement Orders
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track and manage your medical and dental supplies order history.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No orders placed yet</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            When you place an order for clinical equipment or consumables, it will appear here.
          </p>
          <Button asChild className="mt-6">
            <Link href="/shop">Browse Supplies Catalog</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="group rounded-xl border border-border bg-card p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-foreground">
                    #{order.id.slice(-8).toUpperCase()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(order.status)}
                  <Badge variant="outline" className="text-[11px] font-normal">
                    {order.paymentStatus === "PAID" ? "Paid" : "COD (Unpaid)"}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Thumbnails preview */}
                <div className="flex items-center gap-2 overflow-x-auto">
                  {order.items.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="relative size-12 shrink-0 overflow-hidden rounded-md border border-border bg-muted"
                      title={item.productName}
                    >
                      {item.product?.images?.[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <Package className="h-5 w-5 text-muted-foreground m-auto" />
                      )}
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-xs font-semibold text-muted-foreground">
                      +{order.items.length - 4}
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground ml-2">
                    {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                  </span>
                </div>

                {/* Total and Action */}
                <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total (COD)</p>
                    <p className="text-base font-bold text-foreground tabular-nums">
                      {formatNumber(order.total)} EGP
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="gap-1 group-hover:border-primary">
                    <Link href={`/checkout/success/${order.id}`}>
                      Details <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
