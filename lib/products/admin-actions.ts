//lib/products/admin-actions.ts
"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import prisma from "@/lib/config/prisma";

const updateProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.array(z.string()),
  madeIn: z.string().nullable(),
  basePrice: z.coerce.number().positive(),
  images: z.array(z.string()),
  categoryId: z.string().min(1),
  brandId: z.string().nullable(),
  isActive: z.coerce.boolean(),
  archived: z.coerce.boolean(),
  featured: z.coerce.boolean(),
  bestSeller: z.coerce.boolean(),
});

const updateVariantSchema = z.object({
  name: z.string().min(1),
  sku: z.string().nullable(),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0),
  isLimitedQuantity: z.coerce.boolean(),
  image: z.string().nullable(),
  isActive: z.coerce.boolean(),
  archived: z.coerce.boolean(),
});

export async function deleteProductAction(productId: string) {
  await prisma.product.update({
    where: { id: productId },
    data: { isActive: false, archived: true },
  });
  console.log("[CACHE INVALIDATE] deleteProductAction - product:", productId);
  revalidateTag("products", "max");
  redirect("/admin/products");
}

export async function updateProductAction(productId: string, raw: unknown) {
  const data = updateProductSchema.parse(raw);

  // Update the product
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

  // If basePrice changed, sync with default variant
  if (data.basePrice) {
    const variants = await prisma.variant.findMany({
      where: { productId },
    });

    // If product has exactly 1 variant named "default", update its price
    if (variants.length === 1) {
      await prisma.variant.update({
        where: { id: variants[0].id },
        data: { price: data.basePrice },
      });
    }
  }

  console.log("[CACHE INVALIDATE] updateProductAction - product:", productId);
  revalidateTag("products", "max");
}
export async function updateVariantAction(variantId: string, raw: unknown) {
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

  console.log("[CACHE INVALIDATE] updateVariantAction - variant:", variantId);
  revalidateTag("products", "max");
}

import type { AdminProductDetail } from "@/lib/types";

export async function getAdminProductBySlug(
  slug: string,
): Promise<AdminProductDetail | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      madeIn: true,
      basePrice: true,
      images: true,
      featured: true,
      bestSeller: true,
      isActive: true,
      archived: true,
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true, logo: true } },
      variants: {
        orderBy: { price: "asc" },
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          stock: true,
          image: true,
          isActive: true,
          archived: true,
        },
      },
      specGroups: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          name: true,
          position: true,
          specs: {
            orderBy: { position: "asc" },
            select: { id: true, key: true, value: true, position: true },
          },
        },
      },
      _count: { select: { reviews: true } },
    },
  });

  if (!product) return null;

  return {
    ...product,
    basePrice: Number(product.basePrice),
    variants: product.variants.map((v) => ({ ...v, price: Number(v.price) })),
  };
}
