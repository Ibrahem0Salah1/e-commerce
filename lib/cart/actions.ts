"use server";

import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import prisma from "@/lib/config/prisma";
import { Prisma } from "@prisma/client";
import type { CartItem } from "@/lib/types";
import { fetchCartItems } from "@/lib/cart/queries";

type ActionResult =
  | {
    success: true;
    toast: { type: "success"; title: string; description?: string };
  }
  | {
    success: false;
    toast: { type: "error"; title: string; description?: string };
  };

const success = (title: string, description?: string): ActionResult => ({
  success: true,
  toast: { type: "success", title, description },
});

const error = (title: string, description?: string): ActionResult => ({
  success: false,
  toast: { type: "error", title, description },
});

const signInError = (): ActionResult => error("Please sign in");

/**
 * Runs a transaction, retrying on unique-constraint conflicts (P2002). Two
 * concurrent "first add" requests for the same product can both see "no row"
 * and both try to create — the loser of that race retries and takes the
 * conditional-update path instead.
 */
async function withRetryOnConflict<T>(
  fn: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isConflict =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002";
      if (isConflict && attempt < attempts) continue;
      throw err;
    }
  }
}

export async function getCartAction(): Promise<CartItem[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];
  return fetchCartItems(session.user.id);
}

export async function addToCartAction(
  productId: string,
  quantity = 1,
): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return signInError();

  if (typeof productId !== "string" || productId.length === 0) {
    return error("Invalid product");
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return error("Invalid quantity");
  }

  const userId = session.user.id;

  try {
    const outcome = await withRetryOnConflict(() =>
      prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
          where: { id: productId },
          select: { stock: true, isActive: true, name: true },
        });

        if (!product || !product.isActive) {
          return { kind: "unavailable" } as const;
        }

        const availableStock = product.stock ?? 0;
        if (availableStock <= 0) return { kind: "out_of_stock" } as const;
        if (quantity > availableStock) {
          return { kind: "limit", stock: availableStock, current: 0 } as const;
        }

        // Conditional increment: only matches if the current row quantity can
        // absorb this add without exceeding stock. This makes the stock check
        // and the write a single atomic statement.
        const updated = await tx.cartItem.updateMany({
          where: {
            userId,
            productId,
            quantity: { lte: availableStock - quantity },
          },
          data: { quantity: { increment: quantity } },
        });

        if (updated.count === 1) {
          return { kind: "ok", name: product.name } as const;
        }

        const existing = await tx.cartItem.findUnique({
          where: { userId_productId: { userId, productId } },
          select: { quantity: true },
        });

        if (existing) {
          return {
            kind: "limit",
            stock: availableStock,
            current: existing.quantity,
          } as const;
        }

        await tx.cartItem.create({ data: { userId, productId, quantity } });
        return { kind: "ok", name: product.name } as const;
      }),
    );

    switch (outcome.kind) {
      case "ok":
        return success("Added to cart", `${outcome.name} has been added.`);
      case "unavailable":
        return error("Product unavailable", "This product is no longer available.");
      case "out_of_stock":
        return error("Out of stock", "This item is currently unavailable.");
      case "limit": {
        const remaining = outcome.stock - outcome.current;
        return error(
          "Stock limit reached",
          `Only ${remaining} more available. (In stock: ${outcome.stock})`,
        );
      }
    }
  } catch {
    return error("Something went wrong", "Could not add the item to your cart.");
  }
}

export async function updateCartQuantityAction(
  productId: string,
  quantity: number,
): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return signInError();

  if (!Number.isInteger(quantity)) return error("Invalid quantity");

  if (quantity <= 0) {
    await prisma.cartItem.deleteMany({
      where: { userId: session.user.id, productId },
    });
    return success("Item removed");
  }

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { stock: true, isActive: true, name: true },
    });

    if (!product || !product.isActive) {
      return error("Product unavailable", "This product is no longer available.");
    }

    const availableStock = product.stock ?? 0;
    if (quantity > availableStock) {
      return error(
        "Stock limit reached",
        `Only ${availableStock} units available.`,
      );
    }

    // Atomic guard: the write re-verifies the cap against live data, closing
    // the TOCTOU window between the stock read above and this update.
    const updated = await tx.cartItem.updateMany({
      where: {
        userId: session.user.id,
        productId,
        quantity: { lte: availableStock - quantity },
      },
      data: { quantity },
    });

    if (updated.count === 0) {
      const existing = await tx.cartItem.findUnique({
        where: {
          userId_productId: { userId: session.user.id, productId },
        },
        select: { quantity: true },
      });
      return existing
        ? error(
            "Stock limit reached",
            `Only ${availableStock} units available.`,
          )
        : error("Item not in cart");
    }

    return success("Quantity updated");
  });
}

export async function removeFromCartAction(
  productId: string,
): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return signInError();

  await prisma.cartItem.deleteMany({
    where: { userId: session.user.id, productId },
  });

  return success("Item removed", "Item has been removed from your cart.");
}

export async function clearCartAction(): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return signInError();

  await prisma.cartItem.deleteMany({ where: { userId: session.user.id } });

  return success("Cart cleared");
}

/* ── Merge guest cart on login (single server round-trip) ── */

type MergedProduct = {
  productId: string;
  /** Units actually stored — may be stock-clamped below requestedQuantity. */
  quantity: number;
  requestedQuantity: number;
};

export type MergeCartOutcome = {
  /** Stored successfully (possibly stock-clamped). Safe to drop locally. */
  added: MergedProduct[];
  /**
   * Nothing fit — the DB cart already holds this product at (or above) the
   * stock cap. Safe to drop locally: the account cart already covers it.
   */
  skippedStockFull: string[];
  /** Deleted, deactivated, or zero-stock. Client policy: auto-discard. */
  unavailable: string[];
  /** NOT processed at all (no session / unexpected error). Keep locally for retry. */
  pending: string[];
};

export async function mergeCartAction(
  items: { productId: string; quantity: number }[],
): Promise<MergeCartOutcome> {
  const session = await auth.api.getSession({ headers: await headers() });
  const allIds = items.map((i) => i.productId);
  if (!session?.user) {
    // Nothing was processed — caller keeps everything locally and can retry.
    return { added: [], skippedStockFull: [], unavailable: [], pending: allIds };
  }

  // Defensive: the guest store should only ever hold positive integers, but
  // the payload is client-controlled (localStorage), so drop anything else.
  const valid = items.filter(
    (i) => Number.isInteger(i.quantity) && i.quantity > 0,
  );
  if (valid.length === 0) {
    return { added: [], skippedStockFull: [], unavailable: [], pending: [] };
  }

  // Group quantities per product (guest cart may contain duplicates)
  const grouped = new Map<string, number>();
  valid.forEach(({ productId, quantity }) => {
    grouped.set(productId, (grouped.get(productId) ?? 0) + quantity);
  });

  const productIds = [...grouped.keys()];
  const userId = session.user.id;

  try {
    return await withRetryOnConflict(() =>
      prisma.$transaction(async (tx) => {
        const [products, existingCartItems] = await Promise.all([
          tx.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, stock: true, isActive: true },
          }),
          tx.cartItem.findMany({
            where: { userId, productId: { in: productIds } },
            select: { id: true, productId: true, quantity: true },
          }),
        ]);

        const stockById = new Map(
          products.map((p) => [
            p.id,
            { stock: p.stock ?? 0, isActive: p.isActive },
          ]),
        );
        const existingById = new Map(
          existingCartItems.map((ci) => [ci.productId, ci]),
        );

        const added: MergedProduct[] = [];
        const skippedStockFull: string[] = [];
        const unavailable: string[] = [];

        for (const [productId, requested] of grouped.entries()) {
          const meta = stockById.get(productId);

          // Gone from the catalog (or inactive / zero stock) → client discards.
          if (!meta || !meta.isActive || meta.stock <= 0) {
            unavailable.push(productId);
            continue;
          }

          // Clamp-to-stock: store whatever fits instead of failing the whole
          // product. wanted=10, stock=6, cart=0 → add 6, report 6-of-10.
          const currentQty = existingById.get(productId)?.quantity ?? 0;
          const target = Math.min(meta.stock, currentQty + requested);
          const delta = target - currentQty;

          if (delta <= 0) {
            // Already holding everything stock allows — DB cart covers it.
            skippedStockFull.push(productId);
            continue;
          }

          if (currentQty > 0) {
            // Conditional increment guarded by the snapshot we just read.
            const updated = await tx.cartItem.updateMany({
              where: {
                userId,
                productId,
                quantity: { lte: target - delta },
              },
              data: { quantity: { increment: delta } },
            });

            if (updated.count === 1) {
              added.push({
                productId,
                quantity: delta,
                requestedQuantity: requested,
              });
              continue;
            }

            // Row shifted concurrently inside our own transaction window —
            // re-read once and apply the best remaining delta.
            const fresh = await tx.cartItem.findUnique({
              where: { userId_productId: { userId, productId } },
              select: { quantity: true },
            });
            const freshTarget = Math.min(meta.stock, (fresh?.quantity ?? 0) + delta);
            if (!fresh || freshTarget <= fresh.quantity) {
              skippedStockFull.push(productId);
              continue;
            }
            await tx.cartItem.update({
              where: { userId_productId: { userId, productId } },
              data: { quantity: { increment: freshTarget - fresh.quantity } },
            });
            added.push({
              productId,
              quantity: freshTarget - fresh.quantity,
              requestedQuantity: requested,
            });
            continue;
          }

          const createdQty = Math.min(requested, meta.stock);
          await tx.cartItem.create({
            data: { userId, productId, quantity: createdQty },
          });
          added.push({
            productId,
            quantity: createdQty,
            requestedQuantity: requested,
          });
        }

        return { added, skippedStockFull, unavailable, pending: [] };
      }),
    );
  } catch {
    // Unexpected failure — nothing committed reliably; keep everything local.
    return { added: [], skippedStockFull: [], unavailable: [], pending: productIds };
  }
}
