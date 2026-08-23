"use client";

import { useQueryStates } from "nuqs";
import { orderFilterParsers } from "@/lib/orders/filters";

export function useOrdersFilters() {
  return useQueryStates(orderFilterParsers, {});
}
