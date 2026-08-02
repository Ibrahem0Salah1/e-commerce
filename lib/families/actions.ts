"use server";

import { revalidateTag } from "next/cache";
import prisma from "@/lib/config/prisma";
import { requireAdmin } from "@/lib/auth/authz";
import { slugify } from "@/lib/utils/slugify";
import { createFamilySchema, updateFamilySchema } from "./validations";

export async function createFamilyAndInvalidate(raw: unknown) {
  await requireAdmin();

  const data = createFamilySchema.parse(raw);
  let slug = slugify(data.name);

  const existing = await prisma.productFamily.findFirst({
    where: { categoryId: data.categoryId, name: data.name },
  });
  if (existing) throw new Error("A family with this name already exists in this category");

  const slugExists = await prisma.productFamily.findUnique({ where: { slug } });
  if (slugExists) {
    let counter = 1;
    while (
      await prisma.productFamily.findUnique({
        where: { slug: `${slug}-${counter}` },
      })
    ) {
      counter++;
    }
    slug = `${slug}-${counter}`;
  }

  await prisma.productFamily.create({
    data: {
      name: data.name,
      slug,
      categoryId: data.categoryId,
      isActive: data.isActive,
    },
  });

  revalidateTag("families", "max");
  revalidateTag("products", "max");
}

export async function updateFamilyAndInvalidate(
  familySlug: string,
  raw: unknown
) {
  await requireAdmin();

  const data = updateFamilySchema.parse(raw);
  const newSlug = slugify(data.name);

  const existing = await prisma.productFamily.findUnique({
    where: { slug: familySlug },
  });
  if (!existing) throw new Error("Family not found");

  const nameExists = await prisma.productFamily.findFirst({
    where: {
      categoryId: existing.categoryId,
      name: data.name,
      NOT: { id: existing.id },
    },
  });
  if (nameExists)
    throw new Error("A family with this name already exists in this category");

  if (newSlug !== familySlug) {
    const slugExists = await prisma.productFamily.findUnique({
      where: { slug: newSlug },
    });
    if (slugExists) throw new Error("Slug already taken by another family");
  }

  await prisma.productFamily.update({
    where: { slug: familySlug },
    data: {
      name: data.name,
      ...(newSlug !== familySlug ? { slug: newSlug } : {}),
      isActive: data.isActive,
    },
  });

  revalidateTag("families", "max");
  revalidateTag("products", "max");
}

export async function deleteFamilyAndInvalidate(familySlug: string) {
  await requireAdmin();

  const family = await prisma.productFamily.findUnique({
    where: { slug: familySlug },
    select: { id: true, name: true },
  });
  if (!family) throw new Error("Family not found");

  const productCount = await prisma.product.count({
    where: { familyId: family.id },
  });
  if (productCount > 0) {
    throw new Error(
      `Cannot delete: ${productCount} product(s) are still assigned to this family.`
    );
  }

  await prisma.productFamily.delete({ where: { slug: familySlug } });

  revalidateTag("families", "max");
  revalidateTag("products", "max");
}

export async function toggleFamilyActiveAndInvalidate(familySlug: string) {
  await requireAdmin();

  const family = await prisma.productFamily.findUniqueOrThrow({
    where: { slug: familySlug },
    select: { isActive: true },
  });

  await prisma.productFamily.update({
    where: { slug: familySlug },
    data: { isActive: !family.isActive },
  });

  revalidateTag("families", "max");
  revalidateTag("products", "max");
}
