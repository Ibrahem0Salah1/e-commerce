import "server-only";
import prisma from "@/lib/config/prisma";
import type { CartItem } from "@/lib/types";

export async function fetchCartItems(userId: string): Promise<CartItem[]> {
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
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
