"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, PackageSearch, Phone, User } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";
import type { AdminOrderSummary, AdminOrdersResult } from "@/lib/orders/types";
import { useOrders } from "@/hooks/useOrders";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/admin/orders/OrderStatusBadge";
import { OrdersPagination } from "@/components/admin/orders/OrdersPagination";
import { buildWhatsAppLink, buildOrderWhatsAppMessage, isWhatsAppMessageTruncated } from "@/lib/utils/phone";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Orders table — owns the orders query via useOrders(initialData).
 * Every filter/page URL change (useOrdersFilters) produces a new queryKey,
 * which triggers a refetch; keepPreviousData keeps the last page visible
 * while the next one loads.
 */
export function OrdersTable({ initialData }: { initialData: AdminOrdersResult }) {
  const router = useRouter();
  const { data, isFetching, isError } = useOrders(initialData);

  const orders: AdminOrderSummary[] = data?.orders ?? [];
  const pagination = data?.pagination ?? initialData.pagination;

  return (
    <div className="space-y-4">
      {/* Results footer header line */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {pagination.total} order{pagination.total === 1 ? "" : "s"} found
        </span>
        {isFetching && (
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            Refreshing...
          </span>
        )}
      </div>

      {isError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Failed to refresh orders. Showing the last loaded results.
        </p>
      )}

      {orders.length === 0 ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted">
            <PackageSearch className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">No orders found</h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            No orders match your current search or filters. Try adjusting them above.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-opacity data-[refreshing=true]:opacity-70" data-refreshing={isFetching}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Destination</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3 text-right">Total (COD)</th>
                  <th className="w-10 px-2 py-3" aria-label="Open" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    tabIndex={0}
                    role="link"
                    aria-label={`Open order ${order.id}`}
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") router.push(`/admin/orders/${order.id}`);
                    }}
                    className="group cursor-pointer transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
                  >
                    {/* Order ref + date + item thumbnails */}
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-mono text-xs font-bold text-foreground underline-offset-2 hover:text-primary hover:underline"
                      >
                        #{order.id.slice(-8).toUpperCase()}
                      </Link>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatDate(order.createdAt)} · {order.itemCount}{" "}
                        {order.itemCount === 1 ? "item" : "items"}
                      </p>
                      <div className="mt-2 flex items-center gap-1.5">
                        {order.items.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            title={item.productName}
                            className="relative size-7 overflow-hidden rounded border border-border bg-muted"
                          >
                            {item.product?.images?.[0] ? (
                              <Image
                                src={item.product.images[0]}
                                alt={item.productName}
                                fill
                                className="object-cover"
                                sizes="28px"
                              />
                            ) : null}
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <span className="text-[10px] font-medium text-muted-foreground">
                            +{order.items.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="max-w-[180px] px-5 py-4">
                      <p className="truncate text-xs font-semibold text-foreground sm:text-sm">
                        {order.shippingName}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <a
                          href={`tel:${order.shippingPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="truncate text-[11px] tabular-nums text-muted-foreground hover:text-primary hover:underline"
                        >
                          {order.shippingPhone}
                        </a>
                        <a
                          href={`tel:${order.shippingPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Call ${order.shippingName}`}
                          className="inline-flex size-6 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          <Phone className="h-3 w-3" />
                        </a>
                        <a
                          href={buildWhatsAppLink(order.shippingPhone, buildOrderWhatsAppMessage(order))}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`WhatsApp ${order.shippingName}`}
                          title={
                            isWhatsAppMessageTruncated(buildOrderWhatsAppMessage(order))
                              ? "Message will be truncated — see order detail for full info"
                              : undefined
                          }
                          className="inline-flex size-6 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400"
                        >
                          <WhatsAppIcon className="h-3 w-3" />
                        </a>
                      </div>
                      {order.user && (
                        <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                          <User className="h-3 w-3 shrink-0" />
                          <span className="truncate">{order.user.email}</span>
                        </p>
                      )}
                    </td>

                    {/* Destination */}
                    <td className="px-5 py-4">
                      <p className="text-xs font-medium text-foreground">
                        {order.shippingCity}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {order.shippingMethodName ?? "Standard"}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <OrderStatusBadge status={order.status} />
                    </td>

                    {/* Payment */}
                    <td className="px-5 py-4">
                      <PaymentStatusBadge
                        status={order.paymentStatus}
                        method={order.paymentMethod}
                      />
                    </td>

                    {/* Total */}
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <span className="text-sm font-bold tabular-nums text-foreground">
                        {formatNumber(order.total)}
                      </span>
                      <span className="ml-1 text-[10px] font-medium text-muted-foreground">
                        EGP
                      </span>
                    </td>

                    {/* Open chevron */}
                    <td className="px-2 py-4">
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {formatNumber(pagination.total)}
          </p>
          <OrdersPagination totalPages={pagination.totalPages} />
        </div>
      )}
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}
