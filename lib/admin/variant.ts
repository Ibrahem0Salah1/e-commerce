import prisma from "@/lib/config/prisma";
import type { VariantDetail } from "@/lib/types";

export async function getVariantById(
  id: string,
): Promise<VariantDetail | null> {
  const variant = await prisma.variant.findUnique({
    where: { id },
    include: {
      product: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!variant) return null;

  return {
    ...variant,
    price: Number(variant.price),
  };
}
