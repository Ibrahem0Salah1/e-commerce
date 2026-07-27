"use server";

import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import prisma from "@/lib/config/prisma";
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
  if (!session?.user) {
    return {
      success: false,
      toast: {
        type: "error",
        title: "Please sign in",
        description: "You must be logged in to add items to your cart.",
      },
    };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { stock: true, isActive: true, name: true },
  });

  if (!product || !product.isActive) {
    return {
      success: false,
      toast: {
        type: "error",
        title: "Product unavailable",
        description: "This product is no longer available.",
      },
    };
  }

  const existingCartItem = await prisma.cartItem.findFirst({
    where: { userId: session.user.id, productId },
  });

  const currentCartQty = existingCartItem?.quantity ?? 0;
  const projectedTotalQty = currentCartQty + quantity;
  const availableStock = product.stock ?? 0;

  if (availableStock <= 0) {
    return {
      success: false,
      toast: {
        type: "error",
        title: "Out of stock",
        description: "This item is currently unavailable.",
      },
    };
  }

  if (projectedTotalQty > availableStock) {
    const remainingStock = availableStock - currentCartQty;
    return {
      success: false,
      toast: {
        type: "error",
        title: "Stock limit reached",
        description: `Only ${remainingStock} more available. (In stock: ${availableStock})`,
      },
    };
  }

  if (existingCartItem) {
    await prisma.cartItem.update({
      where: { id: existingCartItem.id },
      data: { quantity: { increment: quantity } },
    });
  } else {
    await prisma.cartItem.create({
      data: { userId: session.user.id, productId, quantity },
    });
  }

  return {
    success: true,
    toast: {
      type: "success",
      title: "Added to cart",
      description: `${product.name} has been added.`,
    },
  };
}

export async function updateCartQuantityAction(
  productId: string,
  quantity: number,
): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return {
      success: false,
      toast: { type: "error", title: "Please sign in" },
    };
  }

  if (quantity <= 0) {
    await prisma.cartItem.deleteMany({
      where: { userId: session.user.id, productId },
    });
    return { success: true, toast: { type: "success", title: "Item removed" } };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { stock: true, isActive: true, name: true },
  });

  if (!product || !product.isActive) {
    return {
      success: false,
      toast: {
        type: "error",
        title: "Product unavailable",
        description: "This product is no longer available.",
      },
    };
  }

  const availableStock = product.stock ?? 0;
  if (quantity > availableStock) {
    return {
      success: false,
      toast: {
        type: "error",
        title: "Stock limit reached",
        description: `Only ${availableStock} units available.`,
      },
    };
  }

  await prisma.cartItem.updateMany({
    where: { userId: session.user.id, productId },
    data: { quantity },
  });

  return {
    success: true,
    toast: { type: "success", title: "Quantity updated" },
  };
}

export async function removeFromCartAction(
  productId: string,
): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return {
      success: false,
      toast: { type: "error", title: "Please sign in" },
    };
  }

  await prisma.cartItem.deleteMany({
    where: { userId: session.user.id, productId },
  });

  return {
    success: true,
    toast: {
      type: "success",
      title: "Item removed",
      description: "Item has been removed from your cart.",
    },
  };
}

/* ── NEW ── */
export async function clearCartAction(): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return {
      success: false,
      toast: { type: "error", title: "Please sign in" },
    };
  }

  await prisma.cartItem.deleteMany({
    where: { userId: session.user.id },
  });

  return {
    success: true,
    toast: { type: "success", title: "Cart cleared" },
  };
}