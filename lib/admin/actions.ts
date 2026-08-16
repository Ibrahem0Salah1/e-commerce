// lib/admin/actions.ts
"use server";

import { redirect } from "next/navigation";
import prisma from "@/lib/config/prisma";
import { requireAdmin } from "@/lib/auth/authz";
import {
  addProductSchema,
  updateProductSchema,
} from "@/lib/validations";
import { invalidateCache, invalidatePattern } from "@/lib/config/redis";

/**
 * Create product + attributes + specification groups in one transaction.
 */
export async function addProductAndInvalidate(raw: unknown) {
  await requireAdmin();

  const data = addProductSchema.parse(raw);

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
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
        ...(data.familyId
          ? { family: { connect: { id: data.familyId } } }
          : {}),
        ...(data.brandId ? { brand: { connect: { id: data.brandId } } } : {}),
      },
    });

    if (data.attributes && data.attributes.length > 0) {
      await tx.productAttributeValue.createMany({
        data: data.attributes.map((attr) => ({
          productId: created.id,
          attributeTypeId: attr.attributeTypeId,
          attributeValueId: attr.attributeValueId,
        })),
      });
    }

    for (const group of data.specGroups ?? []) {
      if (!group.specs.length) continue;

      await tx.specificationGroup.create({
        data: {
          productId: created.id,
          name: group.name,
          position: group.position,
          specs: {
            create: group.specs.map((s) => ({
              key: s.key,
              value: s.value,
              position: s.position,
            })),
          },
        },
      });
    }

    return created;
  });

  await invalidatePattern("products:*");
  //
  await invalidateCache(`product:detail:${product.slug}`);
  return { id: product.id, slug: product.slug };
}

export async function updateProductAndInvalidate(
  productId: string,
  raw: unknown,
) {
  await requireAdmin();

  const data = updateProductSchema.parse(raw);

  const updated = await prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id: productId },
      data: {
        name: data.name,
        description: data.description,
        madeIn: data.madeIn,
        images: data.images,
        categoryId: data.categoryId,
        familyId: data.familyId || null,
        brandId: data.brandId || null,
        isActive: data.isActive,
        archived: data.archived,
        featured: data.featured,
        bestSeller: data.bestSeller,
        price: data.price,
        stock: data.stock,
        sku: data.sku || null,
      },
    });

    if (data.attributes) {
      await tx.productAttributeValue.deleteMany({
        where: { productId },
      });
      if (data.attributes.length > 0) {
        await tx.productAttributeValue.createMany({
          data: data.attributes.map((attr) => ({
            productId,
            attributeTypeId: attr.attributeTypeId,
            attributeValueId: attr.attributeValueId,
          })),
        });
      }
    }

    if (data.specGroups) {
      await tx.specificationGroup.deleteMany({
        where: { productId },
      });
      for (const group of data.specGroups) {
        if (!group.specs.length) continue;

        await tx.specificationGroup.create({
          data: {
            productId,
            name: group.name,
            position: group.position,
            specs: {
              create: group.specs.map((s) => ({
                key: s.key,
                value: s.value,
                position: s.position,
              })),
            },
          },
        });
      }
    }

    return updated;
  });

  await invalidateCache(`product:detail:${updated.slug}`);
  await invalidatePattern("products:*");

  return { id: updated.id, slug: updated.slug };
}

export async function deleteProductAndInvalidate(productId: string) {
  await requireAdmin();

  const product = await prisma.product.update({
    where: { id: productId },
    data: { isActive: false, archived: true },
  });

  await invalidateCache(`product:detail:${product.slug}`);
  await invalidatePattern("products:*");

  redirect("/admin/products");
}

export async function toggleProductActiveAndInvalidate(productId: string) {
  await requireAdmin();

  const product = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
    select: { isActive: true, slug: true },
  });

  await prisma.product.update({
    where: { id: productId },
    data: { isActive: !product.isActive },
  });

  await invalidateCache(`product:detail:${product.slug}`);
  await invalidatePattern("products:*");
}