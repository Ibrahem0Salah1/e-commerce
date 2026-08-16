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

    const updated = await tx.cartItem.updateMany({
      where: { userId: session.user.id, productId },
      data: { quantity },
    });

    if (updated.count === 0) {
      return error("Item not in cart");
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
export async function mergeCartAction(
  items: { productId: string; quantity: number }[],
): Promise<{ succeeded: string[]; failed: string[] }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { succeeded: [], failed: items.map((i) => i.productId) };
  }

  // Defensive: the guest store should only ever hold positive integers, but
  // the payload is client-controlled (localStorage), so drop anything else.
  const valid = items.filter(
    (i) => Number.isInteger(i.quantity) && i.quantity > 0,
  );
  if (valid.length === 0) return { succeeded: [], failed: [] };

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

        const succeeded: string[] = [];
        const failed: string[] = [];

        for (const [productId, quantity] of grouped.entries()) {
          const meta = stockById.get(productId);

          if (!meta || !meta.isActive || meta.stock <= 0) {
            failed.push(productId);
            continue;
          }
          if (quantity > meta.stock) {
            failed.push(productId);
            continue;
          }

          const updated = await tx.cartItem.updateMany({
            where: {
              userId,
              productId,
              quantity: { lte: meta.stock - quantity },
            },
            data: { quantity: { increment: quantity } },
          });

          if (updated.count === 1) {
            succeeded.push(productId);
            continue;
          }

          if (existingById.has(productId)) {
            failed.push(productId);
            continue;
          }

          await tx.cartItem.create({
            data: { userId, productId, quantity },
          });
          succeeded.push(productId);
        }

        return { succeeded, failed };
      }),
    );
  } catch {
    return { succeeded: [], failed: productIds };
  }
}
