import "server-only";
import prisma from "@/lib/config/prisma";
import type { CartItem } from "@/lib/types";

export async function fetchCartItems(userId: string): Promise<CartItem[]> {
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        select: { id: true, slug: true, name: true, images: true, price: true,stock: true },
      },
    },
  });

  return cartItems
    .filter((ci) => ci.product !== null)
    .map((ci) => ({
      productId: ci.product!.id,
      slug: ci.product!.slug,
      name: ci.product!.name,
      price: Number(ci.product!.price ?? 0),
      image: ci.product!.images[0] ?? "",
      quantity: ci.quantity,
      stock: ci.product?.stock ?? 0,
    }));
}
