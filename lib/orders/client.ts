import type { AdminOrderMetrics, AdminOrdersResult } from "@/lib/orders/types";
import type { AdminOrdersFilters } from "@/lib/orders/filters";

function toQueryParams(filters: AdminOrdersFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

export async function getOrdersClient(
  filters: AdminOrdersFilters,
): Promise<AdminOrdersResult> {
  const res = await fetch(`/api/admin/orders?${toQueryParams(filters)}`);
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

export async function getOrderMetricsClient(): Promise<AdminOrderMetrics> {
  const res = await fetch(`/api/admin/orders/metrics`);
  if (!res.ok) throw new Error("Failed to fetch order metrics");
  return res.json();
}
