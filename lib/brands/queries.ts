import prisma from "@/lib/config/prisma";
import { plain } from "@/lib/utils/serialize";
import { brandListSelect, brandDetailSelect } from "./selects";
import type { BrandListItem, BrandDetail } from "./types";

export type { BrandListItem, BrandDetail };

export async function getBrands(take?: number): Promise<BrandListItem[]> {
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    ...(take ? { take } : {}),
    select: brandListSelect,
  });
  return plain(brands);
}

export async function getBrandBySlug(slug: string): Promise<BrandDetail | null> {
  const brand = await prisma.brand.findUnique({
    where: { slug },
    select: brandDetailSelect,
  });
  return plain(brand);
}
