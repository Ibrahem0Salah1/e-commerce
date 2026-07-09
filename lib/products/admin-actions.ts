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
  revalidateTag("products", "hours");
  redirect("/admin/products");
}

export async function updateProductAction(productId: string, raw: unknown) {
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

  console.log("[CACHE INVALIDATE] updateProductAction - product:", productId);
  revalidateTag("products", "hours");
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
  revalidateTag("products", "hours");
}

export async function getAdminProductBySlug(slug: string) {
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
