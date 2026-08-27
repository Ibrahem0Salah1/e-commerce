"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getOrdersClient,
  getOrderMetricsClient,
} from "@/lib/orders/client";
import type { AdminOrdersResult, AdminOrderMetrics } from "@/lib/orders/types";
import { useOrdersFilters } from "./useOrdersFilters";

/**
 * Centralized admin orders query. The filters come from the shared URL state
 * (useOrdersFilters), so every filter/page change produces a new queryKey
 * which triggers a refetch automatically.
 */
export function useOrders(initialData?: AdminOrdersResult) {
  const [filters] = useOrdersFilters();

  return useQuery({
    queryKey: ["admin-orders", filters],
    queryFn: () => getOrdersClient(filters),
    placeholderData: keepPreviousData,
    initialData,
    staleTime: 0,
  });
}

export function useOrderMetrics(initialData?: AdminOrderMetrics) {
  return useQuery({
    queryKey: ["admin-order-metrics"],
    queryFn: getOrderMetricsClient,
    initialData,
    staleTime: 30_000,
  });
}
