"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/config/prisma";
import { requireAdmin } from "@/lib/auth/authz";
import {
  createProductSchema,
  updateProductSchema,
  updateVariantSchema,
} from "@/lib/validations";

export async function createProductAndInvalidate(raw: unknown) {
  await requireAdmin();

  const data = createProductSchema.parse(raw);

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      madeIn: data.madeIn,
      basePrice: data.basePrice,
      images: data.images,
      isActive: data.isActive,
      archived: data.archived,
      featured: data.featured,
      bestSeller: data.bestSeller,
      category: { connect: { id: data.categoryId } },
      ...(data.brandId ? { brand: { connect: { id: data.brandId } } } : {}),
    },
  });

  revalidateTag("products", "default");

  return product;
}

export async function updateProductAndInvalidate(productId: string, raw: unknown) {
  await requireAdmin();

  const data = updateProductSchema.parse(raw);

  await prisma.product.update({
    where: { id: productId },
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      madeIn: data.madeIn,
      basePrice: data.basePrice,
      images: data.images,
      categoryId: data.categoryId,
      brandId: data.brandId,
      isActive: data.isActive,
      archived: data.archived,
      featured: data.featured,
      bestSeller: data.bestSeller,
    },
  });

  if (data.basePrice) {
    const variants = await prisma.variant.findMany({
      where: { productId },
    });

    if (variants.length === 1) {
      await prisma.variant.update({
        where: { id: variants[0].id },
        data: { price: data.basePrice },
      });
    }
  }

  revalidateTag("products", "default");
}

export async function deleteProductAndInvalidate(productId: string) {
  await requireAdmin();

  await prisma.product.update({
    where: { id: productId },
    data: { isActive: false, archived: true },
  });

  revalidateTag("products", "default");
  redirect("/admin/products");
}

export async function updateVariantAndInvalidate(variantId: string, raw: unknown) {
  await requireAdmin();

  const data = updateVariantSchema.parse(raw);

  await prisma.variant.update({
    where: { id: variantId },
    data: {
      name: data.name,
      sku: data.sku,
      price: data.price,
      stock: data.stock,
      isLimitedQuantity: data.isLimitedQuantity,
      image: data.image,
      isActive: data.isActive,
      archived: data.archived,
    },
  });

  revalidateTag("products", "default");
}
