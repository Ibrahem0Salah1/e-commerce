import "server-only";
import prisma from "@/lib/config/prisma";
import { Prisma } from "@prisma/client";
import type { AdminProductDetail, ProductListItem } from "@/lib/types";
// import { adminProductDetailSelect } from "@/lib/admin/selects";
export const productListSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  stock: true, 
  sku: true,
  images: true,
  featured: true,
  isActive: true,
  family: {
    select: {
      id: true,
      name: true,
      slug: true,
      category: { select: { id: true, name: true, slug: true } },
    },
  },
  brand: { select: { id: true, name: true, slug: true, logo: true } },
  reviews: { select: { rating: true } },
  _count: { select: { reviews: true } },
} satisfies Prisma.ProductSelect;

export async function getAdminAllProducts(): Promise<ProductListItem[]> {
  console.log("[QUERY] getAdminAllProducts - hitting DB");

  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    select: productListSelect,
  });

  return products.map(({ reviews, _count, price, stock, description, family, ...rest }) => {
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null;

    return {
      ...rest,
      category: family?.category ?? null,
      family: family ? { id: family.id, name: family.name, slug: family.slug } : null,
      description: description ?? [],
      price: Number(price),
      stock: Number(stock),
      reviewCount: _count.reviews,
      rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    };
  });
}

//selects 
export const adminProductDetailSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  madeIn: true,
  price: true,
  stock: true,
  sku: true,
  images: true,
  featured: true,
  bestSeller: true,
  isActive: true,
  archived: true,
  family: {
    select: {
      id: true,
      name: true,
      slug: true,
      category: { select: { id: true, name: true, slug: true } },
    },
  },
  brand: { select: { id: true, name: true, slug: true, logo: true } },
  specGroups: {
    orderBy: { position: "asc" as const },
    select: {
      id: true,
      name: true,
      position: true,
      specs: {
        orderBy: { position: "asc" as const },
        select: { id: true, key: true, value: true, position: true },
      },
    },
  },
  _count: { select: { reviews: true } },
} satisfies Prisma.ProductSelect;
//the function
export async function getAdminProductBySlug(
  slug: string,
): Promise<AdminProductDetail | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    select: adminProductDetailSelect,
  });

  if (!product) return null;

  return {
    ...product,
    category: product.family?.category ?? null,
    family: product.family ? { id: product.family.id, name: product.family.name, slug: product.family.slug } : null,
    price: Number(product.price),
    stock: Number(product.stock),
  };
}
