import type { Prisma, OrderStatus } from "@prisma/client";
import { ALLOWED_ORDER_TRANSITIONS } from "./state-machine";

/**
 * Statuses from which an order may still be cancelled, derived from the
 * state machine so there is a single source of truth.
 */
const CANCELLABLE_STATUSES = (
  Object.entries(ALLOWED_ORDER_TRANSITIONS) as [
    OrderStatus,
    readonly OrderStatus[],
  ][]
)
  .filter(([, next]) => next.includes("CANCELLED"))
  .map(([status]) => status);

export type CancellationOutcome =
  | { result: "CANCELLED"; orderId: string }
  | { result: "ALREADY_CANCELLED" }
  | { result: "NOT_FOUND" }
  | { result: "BLOCKED"; reason: string };

/**
 * Cancels an order and restores stock using the claim-first / act-second
 * pattern so concurrent callers (two admins, admin + cron, double-clicks)
 * can never restore stock twice.
 *
 * MUST be called inside a transaction: if any stock update fails mid-way,
 * the claim (status flip) rolls back with it.
 *
 * 1. CLAIM — an atomic conditional `updateMany` flips the status. The WHERE
 *    clause is re-evaluated against committed data when the row lock is
 *    acquired, so exactly one concurrent caller can match.
 * 2. ACT — only the caller whose claim succeeded increments stock.
 *
 * If this caller loses the race, it reports ALREADY_CANCELLED/BLOCKED and
 * never touches stock.
 */
export async function cancelOrderAndRestoreStock(
  tx: Prisma.TransactionClient,
  orderId: string,
): Promise<CancellationOutcome> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    return { result: "NOT_FOUND" };
  }

  if (order.status === "CANCELLED") {
    return { result: "ALREADY_CANCELLED" };
  }

  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    return {
      result: "BLOCKED",
      reason: `Cannot cancel an order that has already been ${order.status.toLowerCase()}.`,
    };
  }

  // ── CLAIM FIRST ──
  const claimed = await tx.order.updateMany({
    where: { id: orderId, status: { in: CANCELLABLE_STATUSES } },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  if (claimed.count === 0) {
    // Lost the race: another request flipped the status between our read
    // and our write. Re-read to report accurately — but touch no stock.
    const fresh = await tx.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });
    return fresh?.status === "CANCELLED"
      ? { result: "ALREADY_CANCELLED" }
      : { result: "BLOCKED", reason: "Order status changed concurrently." };
  }

  // ── ACT SECOND (winner only) ──
  for (const item of order.items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });
  }

  return { result: "CANCELLED", orderId };
}
