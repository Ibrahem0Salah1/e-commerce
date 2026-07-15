"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/config/prisma";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/authz";
import {
  addProductSchema,
  updateProductSchema,
  updateVariantSchema,
} from "@/lib/validations";

async function recomputeBasePrice(
  tx: Prisma.TransactionClient,
  productId: string,
) {
  const cheapest = await tx.variant.aggregate({
    where: { productId, isActive: true, archived: false },
    _min: { price: true },
  });
  if (cheapest._min.price !== null) {
    await tx.product.update({
      where: { id: productId },
      data: { basePrice: cheapest._min.price },
    });
  }
}

export async function addProductAndInvalidate(raw: unknown) {
  await requireAdmin();

  const data = addProductSchema.parse(raw);

  const product = await prisma.$transaction(async (tx) => {
    const p = await tx.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        madeIn: data.madeIn,
        basePrice: data.price,
        images: data.images,
        isActive: data.isActive,
        archived: data.archived,
        featured: data.featured,
        bestSeller: data.bestSeller,
        category: { connect: { id: data.categoryId } },
        ...(data.familyId ? { family: { connect: { id: data.familyId } } } : {}),
        ...(data.brandId ? { brand: { connect: { id: data.brandId } } } : {}),
      },
    });

    await tx.variant.create({
      data: {
        productId: p.id,
        name: "Default",
        price: data.price,
        stock: data.stock,
        isActive: data.isActive,
      },
    });

    return p;
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
      images: data.images,
      categoryId: data.categoryId,
      familyId: data.familyId,
      brandId: data.brandId,
      isActive: data.isActive,
      archived: data.archived,
      featured: data.featured,
      bestSeller: data.bestSeller,
    },
  });

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

export async function toggleProductActiveAndInvalidate(productId: string) {
  await requireAdmin();

  const product = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
    select: { isActive: true },
  });

  await prisma.product.update({
    where: { id: productId },
    data: { isActive: !product.isActive },
  });

  revalidateTag("products", "default");
}

export async function updateVariantAndInvalidate(variantId: string, raw: unknown) {
  await requireAdmin();

  const data = updateVariantSchema.parse(raw);

  await prisma.$transaction(async (tx) => {
    const variant = await tx.variant.update({
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
      select: { productId: true },
    });

    await recomputeBasePrice(tx, variant.productId);
  });

  revalidateTag("products", "default");
}
