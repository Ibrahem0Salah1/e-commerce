"use server";

import { revalidateTag } from "next/cache";
import prisma from "@/lib/config/prisma";
import { requireAdmin } from "@/lib/auth/authz";
import { slugify } from "@/lib/utils/slugify";
import { createCategorySchema, updateCategorySchema } from "./validations";

export async function createCategoryAndInvalidate(raw: unknown) {
  await requireAdmin();

  const data = createCategorySchema.parse(raw);
  let slug = slugify(data.name);

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    let counter = 1;
    while (await prisma.category.findUnique({ where: { slug: `${slug}-${counter}` } })) {
      counter++;
    }
    slug = `${slug}-${counter}`;
  }

  await prisma.category.create({
    data: {
      name: data.name,
      slug,
      description: data.description || "",
      image: data.image || null,
      isActive: data.isActive,
    },
  });

  revalidateTag("categories", "max");
  revalidateTag("products", "max");
}

export async function updateCategoryAndInvalidate(slug: string, raw: unknown) {
  await requireAdmin();

  const data = updateCategorySchema.parse(raw);
  const newSlug = slugify(data.name);

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (!existing) throw new Error("Category not found");

  if (newSlug !== slug) {
    const slugExists = await prisma.category.findUnique({
      where: { slug: newSlug },
    });
    if (slugExists) throw new Error("Slug already taken by another category");
  }

  await prisma.category.update({
    where: { slug },
    data: {
      name: data.name,
      ...(newSlug !== slug ? { slug: newSlug } : {}),
      description: data.description || "",
      image: data.image || null,
      isActive: data.isActive,
    },
  });

  revalidateTag("categories", "max");
  revalidateTag("products", "max");
}

export async function deleteCategoryAndInvalidate(slug: string) {
  await requireAdmin();

  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!category) throw new Error("Category not found");

  const productCount = await prisma.product.count({
    where: { categoryId: category.id },
  });
  if (productCount > 0) {
    throw new Error(
      `Cannot delete: ${productCount} product(s) are still assigned to this category.`
    );
  }

  await prisma.category.delete({ where: { slug } });

  revalidateTag("categories", "max");
  revalidateTag("products", "max");
}

export async function toggleCategoryActiveAndInvalidate(slug: string) {
  await requireAdmin();

  const category = await prisma.category.findUniqueOrThrow({
    where: { slug },
    select: { isActive: true },
  });

  await prisma.category.update({
    where: { slug },
    data: { isActive: !category.isActive },
  });

  revalidateTag("categories", "max");
  revalidateTag("products", "max");
}
