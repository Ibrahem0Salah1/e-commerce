import "server-only";
import prisma from "@/lib/config/prisma";
import type { VariantDetail } from "@/lib/types";
import { variantDetailSelect } from "@/lib/admin/selects";

export async function getVariantById(
  id: string,
): Promise<VariantDetail | null> {
  console.log("[QUERY] getVariantById - hitting DB");

  const variant = await prisma.variant.findUnique({
    where: { id },
    select: variantDetailSelect,
  });

  if (!variant) return null;

  return {
    ...variant,
    price: Number(variant.price),
  };
}
