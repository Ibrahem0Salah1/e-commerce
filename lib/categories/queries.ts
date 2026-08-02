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

export async function getCategories(): Promise<CategoryListItem[]> {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: categoryListSelect,
  });
  return plain(categories);
}

export async function getCategoryBySlug(
  slug: string
): Promise<CategoryDetail | null> {
  const category = await prisma.category.findUnique({
    where: { slug },
    select: categoryDetailSelect,
  });
  return plain(category);
}

export async function getCategoryOptions(): Promise<CategoryOption[]> {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: categoryOptionSelect,
  });
  return plain(categories);
}

export async function getCategoryById(
  id: string
): Promise<CategoryOption | null> {
  const category = await prisma.category.findUnique({
    where: { id },
    select: categoryOptionSelect,
  });
  return plain(category);
}

export async function getCategoriesWithFamilies(): Promise<CategoryWithFamilies[]> {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: categoryWithFamiliesSelect,
  });
  return plain(categories);
}
