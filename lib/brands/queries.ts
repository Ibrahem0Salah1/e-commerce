import { unstable_cache } from "next/cache";
import prisma from "@/lib/config/prisma";
import { plain } from "@/lib/utils/serialize";
import { brandListSelect, brandDetailSelect } from "./selects";
import type { BrandListItem, BrandDetail } from "./types";

export type { BrandListItem, BrandDetail };

/**
 * Brands rarely change — reads are cached with Next.js' built-in data cache
 * (unstable_cache) and tagged "brands". Every mutation in lib/brands/actions.ts
 * calls revalidateTag("brands", "max"), which marks entries stale and refreshes
 * them stale-while-revalidate on the next visit. No TTL: freshness is purely
 * tag-driven. If you ever mutate brands outside those actions, revalidate the
 * tag there too (or add a `revalidate` safety net here).
 */
export async function getBrands(take?: number): Promise<BrandListItem[]> {
  return unstable_cache(
    async () => {
      const brands = await prisma.brand.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        ...(take ? { take } : {}),
        select: brandListSelect,
      });
      return plain(brands);
    },
    // distinct cache entry per take so ShopByBrands(12) and full lists coexist
    ["brands-list", take ? String(take) : "all"],
    { tags: ["brands"] },
  )();
}

export async function getBrandBySlug(slug: string): Promise<BrandDetail | null> {
  return unstable_cache(
    async () => {
      const brand = await prisma.brand.findUnique({
        where: { slug },
        select: brandDetailSelect,
      });
      return plain(brand);
    },
    ["brand-detail", slug],
    { tags: ["brands"] },
  )();
}
