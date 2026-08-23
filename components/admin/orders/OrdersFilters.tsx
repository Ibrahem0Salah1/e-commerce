"use client";

import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { SlidersHorizontal, Truck } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/orders/filters";
import { useOrdersFilters } from "@/hooks/useOrdersFilters";
import type { ShippingMethodOption } from "@/lib/orders/types";

const STATUS_LABELS: Record<(typeof ORDER_STATUSES)[number], string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const PAYMENT_LABELS: Record<(typeof PAYMENT_STATUSES)[number], string> = {
  UNPAID: "Unpaid (COD)",
  PAID: "Paid",
  REFUNDED: "Refunded",
  FAILED: "Failed",
};

/**
 * Status / payment / shipping-method filters bound to URL params. Every change
 * also resets the page param so results always start from page 1.
 */
export function OrdersFilters({
  shippingMethods,
}: {
  shippingMethods: ShippingMethodOption[];
}) {
  const [filters, setFilters] = useOrdersFilters();

  const hasActiveFilters =
    filters.status !== "ALL" ||
    filters.payment !== "ALL" ||
    !!filters.method ||
    !!filters.q;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SlidersHorizontal className="hidden h-4 w-4 text-muted-foreground sm:block" />

      <Select
        value={filters.status}
        onValueChange={(v) =>
          setFilters({ status: v as "ALL" | OrderStatus, page: null })
        }
      >
        <SelectTrigger className="h-9 w-[150px]" aria-label="Filter by status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Statuses</SelectItem>
          {ORDER_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.payment}
        onValueChange={(v) =>
          setFilters({ payment: v as "ALL" | PaymentStatus, page: null })
        }
      >
        <SelectTrigger className="h-9 w-[150px]" aria-label="Filter by payment">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Payments</SelectItem>
          {PAYMENT_STATUSES.map((payment) => (
            <SelectItem key={payment} value={payment}>
              {PAYMENT_LABELS[payment]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {shippingMethods.length > 0 && (
        <Select
          value={filters.method || "ALL"}
          onValueChange={(v) =>
            setFilters({ method: v === "ALL" ? null : v, page: null })
          }
        >
          <SelectTrigger className="h-9 w-[170px]" aria-label="Filter by shipping method">
            <Truck className="h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Shipping</SelectItem>
            {shippingMethods.map((method) => (
              <SelectItem key={method.id} value={method.id}>
                {method.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setFilters({ q: null, status: null, payment: null, method: null, page: null })
          }
          className="h-9 cursor-pointer text-muted-foreground hover:text-foreground"
        >
          Reset
        </Button>
      )}
    </div>
  );
}
