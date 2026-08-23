"use server";

import prisma from "@/lib/config/prisma";
import {
  adminUpdateOrderStatusSchema,
  adminCancelOrderSchema,
  adminMarkPaidSchema,
} from "@/lib/validations";
import { auth } from "@/lib/auth/server";
import { requireAdmin } from "@/lib/auth/authz";
import { headers } from "next/headers";
import {
  checkoutRatelimit,
  checkoutIpRatelimit,
  getClientIP,
} from "@/lib/ratelimit";
import { canTransitionOrderStatus } from "./state-machine";
import { cancelOrderAndRestoreStock } from "./cancellation";
import { validateCheckoutInput, createOrderForUser } from "./create-order";
import {
  OrderError,
  type CreateOrderResult,
  type ShippingMethodOption,
  type CustomerOrderSummary,
} from "./types";
import {
  getShippingMethods,
  getCustomerOrders,
  getCustomerOrderDetail,
} from "./queries";

// async function verifyTurnstileToken(token?: string): Promise<boolean> {
//   const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
//   if (!secretKey || !token) {
//     // In dev or when secret is not configured, bypass Turnstile verification
//     return true;
//   }

//   try {
//     const formData = new URLSearchParams();
//     formData.append("secret", secretKey);
//     formData.append("response", token);

//     const res = await fetch(
//       "https://challenges.cloudflare.com/turnstile/v0/siteverify",
//       {
//         method: "POST",
//         body: formData,
//       },
//     );

//     const outcome = await res.json();
//     return outcome.success === true;
//   } catch (err) {
//     console.error("Turnstile verification failed to reach Cloudflare:", err);
//     return true; // Fail open to avoid blocking legitimate users on network glitch
//   }
// }

/**
 * Main createOrder server action.
 *
 * Thin orchestration layer: session/suspension checks → Zod validation →
 * rate limiting (AFTER validation so invalid attempts don't burn quota) →
 * the shared core pipeline in lib/orders/create-order.ts (idempotency +
 * transactional execution). The core is also used by the gated load-test
 * route so both paths exercise identical logic.
 */
export async function createOrder(rawInput: unknown): Promise<CreateOrderResult> {
  // ── 1. Authenticated session check ──
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return {
      success: false,
      error: "You must be signed in to place an order.",
      code: "AUTH",
    };
  }

  const userId = session.user.id;

  // ── 2. Suspended / Banned user check ──
  const user = session.user as typeof session.user & {
    banned?: boolean;
    status?: string;
  };
  if (user.banned || user.status === "SUSPENDED") {
    return {
      success: false,
      error:
        "Your account is currently suspended. Please contact customer support.",
      code: "FORBIDDEN",
    };
  }

  // ── 3. Input validation (Zod) ──
  const validated = validateCheckoutInput(rawInput);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error,
      code: "VALIDATION",
      details: validated.details,
    };
  }

  // ── 4. Rate limiting: per-user primary + per-IP fallback against
  //        multi-account abuse. Skipped when Redis is not configured. ──
  if (process.env.UPSTASH_REDIS_REST_URL) {
    try {
      const [{ success: userAllowed }, { success: ipAllowed }] =
        await Promise.all([
          checkoutRatelimit.limit(userId),
          checkoutIpRatelimit.limit(await getClientIP()),
        ]);

      if (!userAllowed || !ipAllowed) {
        return {
          success: false,
          error:
            "Too many checkout attempts. Please wait a few minutes before trying again.",
          code: "RATE_LIMITED",
        };
      }
    } catch (err) {
      console.warn("Checkout ratelimit check skipped due to redis issue:", err);
    }
  }

  // ── 5. Shared core: aggregation, idempotency, transactional execution ──
  return createOrderForUser(validated.data, userId);
}

// ─────────────────────────────────────────
// CUSTOMER ACTIONS
// ─────────────────────────────────────────

export async function getShippingMethodsAction(): Promise<
  ShippingMethodOption[]
> {
  return getShippingMethods();
}

export async function getUserOrdersAction(): Promise<CustomerOrderSummary[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];
  return getCustomerOrders(session.user.id);
}

export async function getUserOrderDetailAction(
  orderId: string,
): Promise<CustomerOrderSummary | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  return getCustomerOrderDetail(session.user.id, orderId);
}

// ─────────────────────────────────────────
// ADMIN ACTIONS
// ─────────────────────────────────────────

/**
 * Admin action to cancel an order and safely reverse/increment stock for all items.
 * Gated by requireAdmin and idempotent if already cancelled.
 *
 * Delegates to cancelOrderAndRestoreStock (claim-first / act-second) so that
 * concurrent cancellations can never restore stock twice.
 */
export async function adminCancelOrderAction(
  rawInput: unknown,
): Promise<{ success: true; message: string } | { success: false; error: string }> {
  await requireAdmin();

  const parsed = adminCancelOrderSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { orderId } = parsed.data;

  try {
    const outcome = await prisma.$transaction((tx) =>
      cancelOrderAndRestoreStock(tx, orderId),
    );

    switch (outcome.result) {
      case "NOT_FOUND":
        return { success: false, error: "Order not found." };
      case "BLOCKED":
        return { success: false, error: outcome.reason };
      case "ALREADY_CANCELLED":
        return { success: true, message: "Order was already cancelled." };
      case "CANCELLED":
        return { success: true, message: "Order cancelled and stock restored." };
    }
  } catch (err) {
    console.error("Admin order cancellation failed unexpectedly:", err);
    return {
      success: false,
      error: "Failed to cancel the order. Please try again.",
    };
  }
}

/**
 * Admin action to mark COD payment as collected/PAID.
 */
export async function adminMarkOrderPaidAction(
  rawInput: unknown,
): Promise<{ success: true; order: import("@prisma/client").Order } | { success: false; error: string }> {
  await requireAdmin();

  const parsed = adminMarkPaidSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { orderId } = parsed.data;

  try {
    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      select: { paymentStatus: true },
    });

    if (!existing) {
      return { success: false, error: "Order not found." };
    }

    // Idempotent: repeated clicks must not overwrite the original paidAt.
    if (existing.paymentStatus === "PAID") {
      return {
        success: true,
        order: await prisma.order.findUniqueOrThrow({ where: { id: orderId } }),
      };
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        paidAt: new Date(),
      },
    });

    return { success: true, order: updated };
  } catch (err) {
    console.error("Admin mark-paid failed unexpectedly:", err);
    return {
      success: false,
      error: "Failed to record the payment. Please try again.",
    };
  }
}

/**
 * Admin action to update order status following state machine rules.
 * Automatically restores stock if transitioning to CANCELLED.
 */
export async function adminUpdateOrderStatusAction(
  rawInput: unknown,
): Promise<{ success: true; order: import("@prisma/client").Order } | { success: false; error: string }> {
  await requireAdmin();

  const parsed = adminUpdateOrderStatusSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { orderId, newStatus } = parsed.data;

  try {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new OrderError("Order not found.", "INVALID_ITEM");
      }

      if (order.status === newStatus) {
        return { success: true, order };
      }

      if (!canTransitionOrderStatus(order.status, newStatus)) {
        throw new OrderError(
          `Cannot move an order from "${order.status}" to "${newStatus}".`,
          "VALIDATION",
        );
      }

      // Cancellations go through the claim-first helper so stock is only
      // restored by exactly one concurrent caller.
      if (newStatus === "CANCELLED") {
        const outcome = await cancelOrderAndRestoreStock(tx, orderId);
        if (outcome.result !== "CANCELLED") {
          const message =
            outcome.result === "ALREADY_CANCELLED"
              ? "Order is already cancelled."
              : outcome.result === "NOT_FOUND"
                ? "Order not found."
                : outcome.reason;
          throw new OrderError(
            message,
            outcome.result === "ALREADY_CANCELLED" ? "DUPLICATE" : "VALIDATION",
          );
        }
        return {
          success: true,
          order: await tx.order.findUniqueOrThrow({ where: { id: orderId } }),
        };
      }

      // Other transitions: conditional claim so two conflicting concurrent
      // updates (e.g., one admin confirms while another cancels) can't both win.
      const claimed = await tx.order.updateMany({
        where: { id: orderId, status: order.status },
        data: { status: newStatus },
      });

      if (claimed.count === 0) {
        throw new OrderError(
          "The order status changed while saving. Refresh and try again.",
          "SERVER_ERROR",
        );
      }

      return {
        success: true,
        order: await tx.order.findUniqueOrThrow({ where: { id: orderId } }),
      };
    });
  } catch (err) {
    if (err instanceof OrderError) {
      return { success: false, error: err.message };
    }
    console.error("Admin order status update failed unexpectedly:", err);
    return {
      success: false,
      error: "Failed to update the order status. Please try again.",
    };
  }
}
