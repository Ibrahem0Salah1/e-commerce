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
  variantId: string,
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

  const variant = await prisma.variant.findUnique({
    where: { id: variantId },
  });

  if (!variant || !variant.isActive) {
    return {
      success: false,
      toast: {
        type: "error",
        title: "Product unavailable",
        description: "This variant is no longer available.",
      },
    };
  }

  const existingCartItem = await prisma.cartItem.findUnique({
    where: { userId_variantId: { userId: session.user.id, variantId } },
  });

  const currentCartQty = existingCartItem?.quantity ?? 0;
  const projectedTotalQty = currentCartQty + quantity;

  if (variant.stock <= 0) {
    return {
      success: false,
      toast: {
        type: "error",
        title: "Out of stock",
        description: "This item is currently unavailable.",
      },
    };
  }

  if (projectedTotalQty > variant.stock) {
    const remainingStock = variant.stock - currentCartQty;
    return {
      success: false,
      toast: {
        type: "error",
        title: "Stock limit reached",
        description: `You can only add ${remainingStock} more of this item. (Total available: ${variant.stock})`,
      },
    };
  }

  await prisma.cartItem.upsert({
    where: { userId_variantId: { userId: session.user.id, variantId } },
    create: { userId: session.user.id, variantId, quantity },
    update: { quantity: { increment: quantity } },
  });

  return {
    success: true,
    toast: {
      type: "success",
      title: "Added to cart",
      description: "Item has been added to your cart.",
    },
  };
}

export async function updateCartQuantityAction(
  variantId: string,
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
      where: { userId: session.user.id, variantId },
    });
    return { success: true, toast: { type: "success", title: "Item removed" } };
  }

  const variant = await prisma.variant.findUnique({
    where: { id: variantId },
    select: { stock: true, isActive: true },
  });

  if (!variant || !variant.isActive) {
    return {
      success: false,
      toast: {
        type: "error",
        title: "Product unavailable",
        description: "This variant is no longer available.",
      },
    };
  }

  if (quantity > variant.stock) {
    return {
      success: false,
      toast: {
        type: "error",
        title: "Stock limit reached",
        description: `Only ${variant.stock} units of this item are available.`,
      },
    };
  }

  await prisma.cartItem.updateMany({
    where: { userId: session.user.id, variantId },
    data: { quantity },
  });

  return {
    success: true,
    toast: { type: "success", title: "Quantity updated" },
  };
}

export async function removeFromCartAction(
  variantId: string,
): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return {
      success: false,
      toast: { type: "error", title: "Please sign in" },
    };
  }

  await prisma.cartItem.deleteMany({
    where: { userId: session.user.id, variantId },
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
