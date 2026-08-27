"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Banknote, XCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import type { OrderStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { getAllowedNextStatuses } from "@/lib/orders/state-machine";
import {
  adminUpdateOrderStatusAction,
  adminMarkOrderPaidAction,
  adminCancelOrderAction,
} from "@/lib/orders/actions";
import type { AdminOrderSummary } from "@/lib/orders/types";

const STATUS_ACTION_LABELS: Record<OrderStatus, string> = {
  PENDING: "Move to Pending",
  CONFIRMED: "Confirm order",
  SHIPPED: "Mark as shipped",
  DELIVERED: "Mark as delivered",
  CANCELLED: "Cancel order",
};

/**
 * All mutating admin operations for a single order, driven by the shared
 * state machine (only legal next transitions are offered).
 */
export function AdminOrderActions({ order }: { order: AdminOrderSummary }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const allowedNext = getAllowedNextStatuses(order.status);
  const isTerminal =
    order.status === "DELIVERED" || order.status === "CANCELLED";

  async function invalidateOrderData() {
    await Promise.all([
      // Refresh the list + metrics caches used by the orders dashboard
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-order-metrics"] }),
      // This detail page renders its data server-side — re-render it
      router.refresh(),
    ]);
  }

  async function handleStatusChange(newStatus: OrderStatus) {
    if (
      newStatus === "CANCELLED" &&
      !window.confirm(
        "Cancel this order? Stock will be restored to inventory. This cannot be undone.",
      )
    ) {
      return;
    }

    setPendingAction(`status-${newStatus}`);
    try {
      const res = await adminUpdateOrderStatusAction({
        orderId: order.id,
        newStatus,
      });

      if (!res.success) {
        toast.error("Could not update status", { description: res.error });
        return;
      }

      toast.success(`Order moved to ${newStatus.toLowerCase()}`);
      await invalidateOrderData();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleMarkPaid() {
    setPendingAction("mark-paid");
    try {
      const res = await adminMarkOrderPaidAction({ orderId: order.id });

      if (!res.success) {
        toast.error("Could not record payment", { description: res.error });
        return;
      }

      toast.success("COD payment recorded as PAID");
      await invalidateOrderData();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleCancelOrder() {
    if (
      !window.confirm(
        "Cancel this order? Stock will be restored to inventory. This cannot be undone.",
      )
    ) {
      return;
    }

    setPendingAction("cancel");
    try {
      const res = await adminCancelOrderAction({ orderId: order.id });

      if (!res.success) {
        toast.error("Could not cancel order", { description: res.error });
        return;
      }

      toast.success(res.message || "Order cancelled and stock restored");
      await invalidateOrderData();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPendingAction(null);
    }
  }

  const isBusy = pendingAction !== null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Actions
        </h3>
        {isTerminal && (
          <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Terminal — status locked
          </span>
        )}
      </div>

      {!isTerminal ? (
        <div className="flex flex-wrap items-center gap-2">
          {allowedNext
            .filter((status) => status !== "CANCELLED")
            .map((status) => {
              const key = `status-${status}`;
              return (
                <Button
                  key={status}
                  size="sm"
                  disabled={isBusy}
                  onClick={() => handleStatusChange(status)}
                  className="cursor-pointer gap-1.5"
                >
                  {pendingAction === key ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5" />
                  )}
                  {STATUS_ACTION_LABELS[status]}
                </Button>
              );
            })}

          {/* Explicit destructive cancel (kept separate from progressions) */}
          {allowedNext.includes("CANCELLED") && (
            <Button
              size="sm"
              variant="destructive"
              disabled={isBusy}
              onClick={handleCancelOrder}
              className="cursor-pointer gap-1.5"
            >
              {pendingAction === "cancel" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              Cancel &amp; restore stock
            </Button>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          This order is in a terminal state ({order.status.toLowerCase()}) — status
          transitions are locked.
        </p>
      )}

      {/* Payment recording stays available in EVERY status — a delivered or
          even cancelled COD order may still need its cash collection logged. */}
      {order.paymentStatus === "UNPAID" && (
        <div className={isTerminal ? "mt-3 border-t border-border pt-3" : ""}>
          <Button
            size="sm"
            variant="outline"
            disabled={isBusy}
            onClick={handleMarkPaid}
            className="cursor-pointer gap-1.5 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            {pendingAction === "mark-paid" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Banknote className="h-3.5 w-3.5" />
            )}
            Mark COD as paid
          </Button>
        </div>
      )}
    </div>
  );
}
