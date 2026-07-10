import "server-only";
import prisma from "@/lib/config/prisma";
import type { VariantDetail } from "@/lib/types";

export async function getVariantById(
  id: string,
): Promise<VariantDetail | null> {
  console.log("[QUERY] getVariantById - hitting DB");

  const variant = await prisma.variant.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      stock: true,
      isLimitedQuantity: true,
      image: true,
      isActive: true,
      archived: true,
      createdAt: true,
      updatedAt: true,
      productId: true,
      product: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!variant) return null;

  return {
    ...variant,
    price: Number(variant.price),
  };
}
