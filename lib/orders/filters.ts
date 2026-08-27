import {
  createSearchParamsCache,
  inferParserType,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";
import { OrderStatus, PaymentStatus } from "@prisma/client";

export const ORDER_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
export const PAYMENT_STATUSES = ["UNPAID", "PAID", "REFUNDED", "FAILED"] as const;

export const orderFilterParsers = {
  q: parseAsString.withDefault("").withOptions({
    clearOnDefault: true,
    scroll: false,
  }),
  status: parseAsStringEnum(["ALL", ...ORDER_STATUSES])
    .withDefault("ALL")
    .withOptions({ clearOnDefault: true }),
  payment: parseAsStringEnum(["ALL", ...PAYMENT_STATUSES])
    .withDefault("ALL")
    .withOptions({ clearOnDefault: true }),
  method: parseAsString.withDefault("").withOptions({
    clearOnDefault: true,
  }),
  page: parseAsInteger
    .withDefault(1)
    .withOptions({ clearOnDefault: true, scroll: true }),
  limit: parseAsInteger
    .withDefault(15)
    .withOptions({ clearOnDefault: true }),
};

export const orderFiltersCache = createSearchParamsCache(orderFilterParsers);

export type AdminOrdersFilters = inferParserType<typeof orderFilterParsers>;

/** Maps URL filter values to Prisma query inputs ("ALL" sentinel → undefined). */
export function resolveAdminOrderFilters(filters: AdminOrdersFilters): {
  page: number;
  limit: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  shippingMethodId?: string;
  search?: string;
} {
  const status =
    filters.status !== "ALL" ? (filters.status as OrderStatus) : undefined;
  const paymentStatus =
    filters.payment !== "ALL" ? (filters.payment as PaymentStatus) : undefined;

  return {
    page: filters.page,
    limit: filters.limit,
    status,
    paymentStatus,
    shippingMethodId: filters.method || undefined,
    search: filters.q.trim() || undefined,
  };
}
