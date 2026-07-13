import { unstable_cache } from "next/cache";
import prisma from "@/lib/config/prisma";

export const getCategories = unstable_cache(
  async () => {
    return prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: "asc" },
    });
  },
  ["categories-nav"],
  { revalidate: 3600 },
);

export const getBrands = unstable_cache(
  async () => {
    return prisma.brand.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
      },
      orderBy: { name: "asc" },
    });
  },
  ["brands-nav"],
  { revalidate: 3600 },
);
