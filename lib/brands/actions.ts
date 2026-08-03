"use server";

import { revalidateTag } from "next/cache";
import prisma from "@/lib/config/prisma";
import { requireAdmin } from "@/lib/auth/authz";
import { slugify } from "@/lib/utils/slugify";
import { createBrandSchema, updateBrandSchema } from "./validations";

export async function createBrandAndInvalidate(raw: unknown) {
  await requireAdmin();

  const data = createBrandSchema.parse(raw);
  let slug = slugify(data.name);

  const slugExists = await prisma.brand.findUnique({ where: { slug } });
  if (slugExists) {
    let counter = 1;
    while (
      await prisma.brand.findUnique({ where: { slug: `${slug}-${counter}` } })
    ) {
      counter++;
    }
    slug = `${slug}-${counter}`;
  }

  await prisma.brand.create({
    data: {
      name: data.name,
      slug,
      logo: data.logo || "",
      description: data.description || "",
      isActive: data.isActive,
    },
  });

  revalidateTag("brands", "max");
  revalidateTag("products", "max");
}

export async function updateBrandAndInvalidate(slug: string, raw: unknown) {
  await requireAdmin();

  const data = updateBrandSchema.parse(raw);
  const newSlug = slugify(data.name);

  const existing = await prisma.brand.findUnique({ where: { slug } });
  if (!existing) throw new Error("Brand not found");

  if (newSlug !== slug) {
    const slugExists = await prisma.brand.findUnique({
      where: { slug: newSlug },
    });
    if (slugExists) throw new Error("Slug already taken by another brand");
  }

  await prisma.brand.update({
    where: { slug },
    data: {
      name: data.name,
      ...(newSlug !== slug ? { slug: newSlug } : {}),
      logo: data.logo || "",
      description: data.description || "",
      isActive: data.isActive,
    },
  });

  revalidateTag("brands", "max");
  revalidateTag("products", "max");
}

export async function deleteBrandAndInvalidate(slug: string) {
  await requireAdmin();

  const brand = await prisma.brand.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!brand) throw new Error("Brand not found");

  const productCount = await prisma.product.count({
    where: { brandId: brand.id },
  });
  if (productCount > 0) {
    throw new Error(
      `Cannot delete: ${productCount} product(s) are still assigned to this brand.`
    );
  }

  await prisma.brand.delete({ where: { slug } });

  revalidateTag("brands", "max");
  revalidateTag("products", "max");
}

export async function toggleBrandActiveAndInvalidate(slug: string) {
  await requireAdmin();

  const brand = await prisma.brand.findUniqueOrThrow({
    where: { slug },
    select: { isActive: true },
  });

  await prisma.brand.update({
    where: { slug },
    data: { isActive: !brand.isActive },
  });

  revalidateTag("brands", "max");
  revalidateTag("products", "max");
}
