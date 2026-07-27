"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/config/prisma";
import { requireAdmin } from "@/lib/auth/authz";
import {
  addProductSchema,
  updateProductSchema,
} from "@/lib/validations";

export async function addProductAndInvalidate(raw: unknown) {
  await requireAdmin();

  const data = addProductSchema.parse(raw);

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      madeIn: data.madeIn,
      price: data.price,
      stock: data.stock,
      ...(data.sku ? { sku: data.sku } : {}),
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

  if (data.attributes && data.attributes.length > 0) {
    await prisma.productAttributeValue.createMany({
      data: data.attributes.map((attr) => ({
        productId: product.id,
        attributeTypeId: attr.attributeTypeId,
        attributeValueId: attr.attributeValueId,
      })),
    });
  }

  revalidateTag("products", "max");

  return product;
}
export async function updateProductAndInvalidate(
  productId: string,
  raw: unknown
) {
  await requireAdmin();

  const data = updateProductSchema.parse(raw);

  await prisma.product.update({
    where: { id: productId },
    data: {
      name: data.name,
      // slug intentionally omitted — never changed after creation
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
      price: data.price,
      stock: data.stock,
      ...(data.sku ? { sku: data.sku } : {}),
    },
  });

  revalidateTag("products", "max");
}
//delete
export async function deleteProductAndInvalidate(productId: string) {
  await requireAdmin();

  await prisma.product.update({
    where: { id: productId },
    data: { isActive: false, archived: true },
  });

  revalidateTag("products", "max");
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

  revalidateTag("products", "max");
}
