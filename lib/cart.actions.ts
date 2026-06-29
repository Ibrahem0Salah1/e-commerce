"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import type { CartItem } from "@/lib/types";

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

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: session.user.id },
    include: {
      variant: {
        select: {
          id: true,
          name: true,
          price: true,
          image: true,
          product: {
            select: { id: true, slug: true, name: true, images: true },
          },
        },
      },
    },
  });

  return cartItems.map((ci) => ({
    variantId: ci.variantId,
    productId: ci.variant.product.id,
    slug: ci.variant.product.slug,
    name: ci.variant.product.name,
    price: Number(ci.variant.price),
    image: ci.variant.product.images[0] ?? ci.variant.image ?? "",
    variantName: ci.variant.name,
    quantity: ci.quantity,
  }));
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
  if (variant.stock < quantity) {
    return {
      success: false,
      toast: {
        type: "error",
        title: "Out of stock",
        description: `Only ${variant.stock} units available.`,
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
