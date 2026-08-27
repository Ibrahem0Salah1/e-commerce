import type { SearchParams } from "nuqs/server";
import {
  getAdminOrders,
  getAdminOrderMetrics,
  getShippingMethods,
} from "@/lib/orders/queries";
import {
  orderFiltersCache,
  resolveAdminOrderFilters,
} from "@/lib/orders/filters";
import { OrdersStatsGrid } from "@/components/admin/orders/OrdersStatsGrid";
import { OrdersSearchInput } from "@/components/admin/orders/OrdersSearchInput";
import { OrdersFilters } from "@/components/admin/orders/OrdersFilters";
import { OrdersTable } from "@/components/admin/orders/OrdersTable";

/**
 * Server component: parses the URL filters once for SSR, fetches the initial
 * page of orders + metrics server-side, then hands off to client components.
 * All subsequent filter/page changes are handled client-side by useOrders
 * (React Query) hitting /api/admin/orders.
 */
export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = await orderFiltersCache.parse(searchParams);
  const query = resolveAdminOrderFilters(filters);

  const [initialMetrics, initialOrders, shippingMethods] = await Promise.all([
    getAdminOrderMetrics(),
    getAdminOrders(query),
    getShippingMethods(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Orders
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review procurement orders, progress fulfillment, and verify COD payments.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <OrdersStatsGrid initialData={initialMetrics} />

      {/* Toolbar: search + filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <OrdersSearchInput />
        <OrdersFilters shippingMethods={shippingMethods} />
      </div>

      {/* Table (owns query + pagination footer) */}
      <OrdersTable initialData={initialOrders} />
    </div>
  );
}
