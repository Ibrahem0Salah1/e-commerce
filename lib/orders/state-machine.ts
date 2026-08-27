import { OrderStatus } from "@prisma/client";

/**
 * State machine defining valid transitions between OrderStatus values.
 * Terminal states: DELIVERED, CANCELLED.
 */
export const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
} as const;

/**
 * Checks if transitioning from currentStatus to nextStatus is permitted.
 */
export function canTransitionOrderStatus(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
): boolean {
  if (currentStatus === nextStatus) return true;
  const allowed = ALLOWED_ORDER_TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
}

/**
 * Returns list of next possible statuses from the given current status.
 */
export function getAllowedNextStatuses(
  currentStatus: OrderStatus,
): readonly OrderStatus[] {
  return ALLOWED_ORDER_TRANSITIONS[currentStatus] || [];
}
