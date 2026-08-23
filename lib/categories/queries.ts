import { unstable_cache } from "next/cache";
import prisma from "@/lib/config/prisma";
import { plain } from "@/lib/utils/serialize";
import {
  categoryListSelect,
  categoryDetailSelect,
  categoryOptionSelect,
  categoryWithFamiliesSelect,
} from "./selects";
import type {
  CategoryListItem,
  CategoryDetail,
  CategoryOption,
  CategoryWithFamilies,
} from "./types";

export type { CategoryListItem, CategoryDetail, CategoryOption, CategoryWithFamilies };

/**
 * Categories rarely change — reads are cached with Next.js' built-in data
 * cache (unstable_cache) and tagged "categories". Every mutation in
 * lib/categories/actions.ts calls revalidateTag("categories", "max"), which
 * marks entries stale and refreshes them stale-while-revalidate on the next
 * visit. No TTL: freshness is purely tag-driven. If you ever mutate categories
 * outside those actions, revalidate the tag there too (or add a `revalidate`
 * safety net here).
 */
export async function getCategories(): Promise<CategoryListItem[]> {
  return unstable_cache(
    async () => {
      const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
        select: categoryListSelect,
      });
      return plain(categories);
    },
    ["categories-list"],
    { tags: ["categories"] },
  )();
}

export async function getCategoryBySlug(
  slug: string
): Promise<CategoryDetail | null> {
  return unstable_cache(
    async () => {
      const category = await prisma.category.findUnique({
        where: { slug },
        select: categoryDetailSelect,
      });
      return plain(category);
    },
    ["category-detail", slug],
    { tags: ["categories"] },
  )();
}

export async function getCategoryOptions(): Promise<CategoryOption[]> {
  return unstable_cache(
    async () => {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: categoryOptionSelect,
      });
      return plain(categories);
    },
    ["category-options"],
    { tags: ["categories"] },
  )();
}

export async function getCategoryById(
  id: string
): Promise<CategoryOption | null> {
  return unstable_cache(
    async () => {
      const category = await prisma.category.findUnique({
        where: { id },
        select: categoryOptionSelect,
      });
      return plain(category);
    },
    ["category-by-id", id],
    { tags: ["categories"] },
  )();
}

export async function getCategoriesWithFamilies(): Promise<CategoryWithFamilies[]> {
  return unstable_cache(
    async () => {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: categoryWithFamiliesSelect,
      });
      return plain(categories);
    },
    ["categories-with-families"],
    { tags: ["categories"] },
  )();
}
