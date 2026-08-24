import { Prisma } from "@prisma/client";
import prisma from "@/lib/config/prisma";
import { checkoutSchema, type CheckoutPayload } from "@/lib/validations";
import {
  OrderError,
  type CreateOrderResult,
  type OrderFailureReason,
} from "./types";

/**
 * Transaction isolation used by order creation.
 *
 * ORDER_TX_ISOLATION env flag lets us A/B the tradeoff under load:
 *  - "Serializable" (default): strongest guarantee â€” tx behaves as if run
 *    alone. Under hot-product contention Postgres aborts overlapping txs
 *    (P2034) instead of letting them proceed, which the retry loop absorbs.
 *  - "ReadCommitted": much higher throughput under contention. Oversell is
 *    STILL impossible because each decrement is an atomic conditional
 *    `updateMany({ where: { stock: { gte } } })` â€” that guard, not the
 *    isolation level, is what protects stock.
 *
 * Only change this after a load-test comparison (see tests/load/README.md).
 */
export function resolveTxIsolation(): Prisma.TransactionIsolationLevel {
  return process.env.ORDER_TX_ISOLATION === "ReadCommitted"
    ? Prisma.TransactionIsolationLevel.ReadCommitted
    : Prisma.TransactionIsolationLevel.Serializable;
}

// One-time visibility when running with the non-default isolation level.
if (
  typeof process !== "undefined" &&
  process.env.ORDER_TX_ISOLATION === "ReadCommitted"
) {
  console.warn(
    "[orders] ORDER_TX_ISOLATION=ReadCommitted â€” verify via tests/load before production use.",
  );
}

export type ValidatedCheckoutInput =
  | { success: true; data: CheckoutPayload }
  | {
      success: false;
      error: string;
      details?: unknown;
    };

/** Zod validation step, separated so callers can interleave rate limiting. */
export function validateCheckoutInput(rawInput: unknown): ValidatedCheckoutInput {
  const parsed = checkoutSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid checkout information.",
      details: parsed.error.flatten(),
    };
  }
  return { success: true, data: parsed.data };
}

/**
 * Core order-creation pipeline: duplicate-item aggregation â†’ per-product caps â†’
 * idempotency pre-check â†’ serializable/read-committed transactional execution
 * with P2034 retries.
 *
 * Shared by the `createOrder` server action AND the gated load-test route so
 * both exercise IDENTICAL logic. Authentication, suspension checks, Turnstile,
 * and rate limiting are caller concerns.
 */
export async function createOrderForUser(
  input: CheckoutPayload,
  userId: string,
): Promise<CreateOrderResult> {
  // â”€â”€ 1. Aggregate duplicate productIds in cart payload â”€â”€
  const itemMap = new Map<string, number>();
  for (const item of input.items) {
    itemMap.set(
      item.productId,
      (itemMap.get(item.productId) ?? 0) + item.quantity,
    );
  }

  const mergedItems = Array.from(itemMap.entries()).map(
    ([productId, quantity]) => ({
      productId,
      quantity,
    }),
  );

  // Re-verify the max quantity per item limit after aggregation
  for (const item of mergedItems) {
    if (item.quantity > 50) {
      return {
        success: false,
        error: "Maximum 50 units allowed per product.",
        code: "VALIDATION",
      };
    }
  }

  // â”€â”€ 2. Idempotency Pre-Check with Ownership Verification â”€â”€
  const existingOrder = await prisma.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    select: { id: true, userId: true, status: true, total: true },
  });

  if (existingOrder) {
    if (existingOrder.userId !== userId) {
      return {
        success: false,
        error: "Invalid idempotency key for current user.",
        code: "VALIDATION",
      };
    }
    return {
      success: true,
      orderId: existingOrder.id,
      status: existingOrder.status,
      total: Number(existingOrder.total),
      alreadyExisted: true,
    };
  }

  // â”€â”€ 3. Transaction Execution with Retries (P2034) â”€â”€
  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const createdOrder = await prisma.$transaction(
        async (tx) => {
          // -- Fetch Shipping Method fresh --
          const shippingMethod = await tx.shippingMethod.findUnique({
            where: { id: input.shippingMethodId },
          });

          if (!shippingMethod || !shippingMethod.isActive) {
            throw new OrderError(
              "Selected shipping method is no longer available.",
              "SHIPPING_INVALID",
            );
          }

          // -- Fetch all Products fresh --
          const productIds = mergedItems.map((i) => i.productId);
          const products = await tx.product.findMany({
            where: { id: { in: productIds } },
          });

          const productMap = new Map(products.map((p) => [p.id, p]));

          for (const item of mergedItems) {
            const product = productMap.get(item.productId);
            if (!product || !product.isActive || product.archived) {
              throw new OrderError(
                `One of the products in your order is no longer available.`,
                "INVALID_ITEM",
              );
            }
          }

          // -- Calculate Subtotal and Snapshot Item Data Server-side --
          let subtotal = new Prisma.Decimal(0);
          const orderItemsData = mergedItems.map((item) => {
            const product = productMap.get(item.productId)!;
            const unitPrice = product.price;
            const totalPrice = unitPrice.mul(item.quantity);
            subtotal = subtotal.add(totalPrice);

            return {
              productId: product.id,
              productName: product.name,
              variantName: product.name,
              unitPrice,
              totalPrice,
              costPriceAtSale: product.costPrice ?? null,
              quantity: item.quantity,
            };
          });

          // -- Insert Order & OrderItems in DB --
          // NOTE ON ORDERING: the hot-row stock decrement runs LAST (below),
          // right before COMMIT. Row locks are held until commit, so doing the
          // decrement early would hold the product-row lock across every
          // subsequent query — collapsing hot-item throughput to
          // 1/(lockHoldTime). Late-decrement minimizes lock hold time to
          // roughly one round trip.

          // -- Calculate total (coupons disabled for MVP) --
          const total = subtotal.add(shippingMethod.price);

          // -- Insert Order & OrderItems in DB --
          const order = await tx.order.create({
            data: {
              userId,
              status: "PENDING",
              paymentStatus: "UNPAID",
              paymentMethod: "COD",
              idempotencyKey: input.idempotencyKey,
              subtotal,
              discountAmount: new Prisma.Decimal(0),
              total,
              shippingMethodId: shippingMethod.id,
              shippingPrice: shippingMethod.price,
              shippingName: input.shippingName,
              shippingPhone: input.shippingPhone,
              shippingAddress: input.shippingAddress,
              shippingCity: input.shippingCity,
              shippingNotes: input.shippingNotes ?? null,
              items: { create: orderItemsData },
            },
            include: { items: true },
          });

          // -- Clear ONLY the ordered products from the user's DB cart. --
          // A blanket delete here would silently destroy items that belong to
          // no order: e.g., a guest-merge landing concurrently with checkout,
          // or an item another tab added after this page loaded.
          await tx.cartItem.deleteMany({
            where: {
              userId,
              productId: { in: mergedItems.map((i) => i.productId) },
            },
          });

          // -- Race-condition safe atomic stock decrement (LAST — see NOTE
          //    ON ORDERING above): conditional guard makes oversell impossible
          //    under any isolation level, and holding these row locks only
          //    until the immediate COMMIT maximizes hot-item throughput. --
          for (const item of mergedItems) {
            const decrementResult = await tx.product.updateMany({
              where: {
                id: item.productId,
                stock: { gte: item.quantity },
              },
              data: {
                stock: { decrement: item.quantity },
              },
            });

            if (decrementResult.count === 0) {
              const product = productMap.get(item.productId);
              throw new OrderError(
                `Insufficient stock for "${product?.name ?? "an item"}". Someone may have just purchased the remaining units.`,
                "OUT_OF_STOCK",
              );
            }
          }

          return order;
        },
        {
          isolationLevel: resolveTxIsolation(),
          maxWait: 5000,
          timeout: 10000,
        },
      );

      return {
        success: true,
        orderId: createdOrder.id,
        status: createdOrder.status,
        total: Number(createdOrder.total),
        alreadyExisted: false,
      };
    } catch (err) {
      if (err instanceof OrderError) {
        return {
          success: false,
          error: err.message,
          code: err.code,
        };
      }

      // Handle Unique Constraint Violation (P2002) for race on idempotencyKey
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        const existing = await prisma.order.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
        });
        if (existing && existing.userId === userId) {
          return {
            success: true,
            orderId: existing.id,
            status: existing.status,
            total: Number(existing.total),
            alreadyExisted: true,
          };
        }
        return {
          success: false,
          error: "This order was already submitted.",
          code: "DUPLICATE",
        };
      }

      // Handle Serialization Conflict (P2034) with linear backoff retry
      const isSerializationFailure =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2034";

      if (isSerializationFailure && attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, 50 * (attempt + 1)));
        continue;
      }

      console.error("Order creation failed unexpectedly:", err);
      // Sanitized classification for the gated load-test route / metrics.
      // Full details stay in this log line only.
      const reason: OrderFailureReason =
        err instanceof Prisma.PrismaClientKnownRequestError
          ? err.code === "P2034"
            ? "TX_CONFLICT"
            : err.code === "P2024"
              ? "DB_CONNECTION"
              : "UNKNOWN"
          : err instanceof Error && err.name === "PrismaClientInitializationError"
            ? "DB_CONNECTION"
            : "UNKNOWN";
      // Never surface raw internal errors (Prisma/DB internals) to clients â€”
      // return a generic message plus the coarse reason label.
      return {
        success: false,
        error: "We couldn't place your order right now. Please try again.",
        code: "SERVER_ERROR",
        reason,
      };
    }
  }

  return {
    success: false,
    error: "Transaction busy. Please try submitting again.",
    code: "SERVER_ERROR",
    reason: "TX_CONFLICT",
  };
}
