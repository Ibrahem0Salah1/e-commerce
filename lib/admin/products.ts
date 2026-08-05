// lib/admin/products.ts
import "server-only";
import prisma from "@/lib/config/prisma";
import type { AdminProductDetail, ProductListItem } from "@/lib/types";
import { adminProductsListSelect } from "@/lib/admin/selects";
import { adminProductDetailSelect } from "@/lib/admin/selects";
import { plain } from "../utils/serialize";

export async function getAdminAllProducts(): Promise<ProductListItem[]> {
  console.log("[QUERY] getAdminAllProducts - hitting DB");

  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    select: adminProductsListSelect,
  });

  return products.map(({ reviews, _count, price, description, family, stock, sku, ...rest }) => {
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length
        : null;

    return {
      ...rest,
      category: family?.category ?? null,
      family: family ? { id: family.id, name: family.name, slug: family.slug } : null,
      description: description ?? [],
      price: Number(price),
      stock: stock !== undefined ? Number(stock) : null,
      sku: sku ?? null,
      reviewCount: _count.reviews,
      rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    };
  });
}

export async function getAdminProductBySlug(
  slug: string,
): Promise<AdminProductDetail | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    select: adminProductDetailSelect,
  });

  if (!product) return null;

  const result = {
    ...product,
    category: product.family?.category ?? null,
    family: product.family ? { id: product.family.id, name: product.family.name, slug: product.family.slug } : null,
    price: Number(product.price),
    stock: Number(product.stock),
  };

  return plain(result);
}