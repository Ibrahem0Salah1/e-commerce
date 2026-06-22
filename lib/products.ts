import prisma from "@/lib/prisma";
import { cache } from "react";
import { Prisma } from "@prisma/client";
import type { ProductDetail, ProductListItem, ProductsResult } from "./types";
import type { ProductFilters } from "./filtersParams";
import { unstable_cache } from "next/cache";

// ─── SERVER ONLY — called from Server Components and API routes ───
// Never import this into a "use client" file

async function queryProducts(filters: ProductFilters): Promise<ProductsResult> {
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(filters.category && { category: { slug: filters.category } }),
    ...(filters.brand && { brand: { slug: filters.brand } }),
    ...(filters.featured && { featured: true }),
    ...(filters.q && { name: { contains: filters.q, mode: "insensitive" } }),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    filters.sort === "price_asc"
      ? { basePrice: "asc" }
      : filters.sort === "price_desc"
        ? { basePrice: "desc" }
        : filters.sort === "name"
          ? { name: "asc" }
          : { createdAt: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        basePrice: true,
        images: true,
        featured: true,
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true, logo: true } },
        variants: {
          where: { isActive: true },
          orderBy: { price: "asc" },
          select: { id: true, name: true, price: true, stock: true },
        },
        reviews: { select: { rating: true } },
        _count: { select: { reviews: true, variants: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const data = products.map(
    ({ reviews, _count, variants, basePrice, ...rest }) => {
      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : null;

      return {
        ...rest,
        basePrice: Number(basePrice),
        variants: variants.map((v) => ({ ...v, price: Number(v.price) })),
        variantCount: _count.variants,
        reviewCount: _count.reviews,
        rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      };
    },
  );

  return {
    products: data,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

export const getProductsServer = unstable_cache(
  async (filters: ProductFilters): Promise<ProductsResult> => {
    return queryProducts(filters);
  },
  ["products"],
  {
    revalidate: 60, // rebuild cache entry every 60 seconds
    tags: ["products"], // lets you invalidate on demand
  },
);
//
// in your admin product update action
// import { revalidateTag } from "next/cache";

// export async function updateProductAction(...) {
//     await prisma.product.update(...);
//     revalidateTag("products"); // next request rebuilds from DB, all others hit cache
// }

export const getFeaturedProducts = cache(
  async (): Promise<ProductListItem[]> => {
    const data = await queryProducts({
      q: "",
      category: "",
      brand: "",
      featured: true,
      sort: "name",
      page: 1,
      limit: 8,
    });
    return data.products;
  },
);

export async function getProductBySlug(
  slug: string,
): Promise<ProductDetail | null> {
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      basePrice: true,
      images: true,
      featured: true,
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true, logo: true } },
      variants: {
        where: { isActive: true },
        orderBy: { price: "asc" },
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          stock: true,
          image: true,
          isActive: true,
        },
      },
      specGroups: {
        orderBy: { position: "asc" },
        select: {
          name: true,
          specs: {
            orderBy: { position: "asc" },
            select: { key: true, value: true },
          },
        },
      },
      reviews: {
        where: { isVisible: true },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          rating: true,
          title: true,
          body: true,
          createdAt: true,
          user: { select: { name: true, image: true } },
        },
      },
      _count: { select: { reviews: true } },
    },
  });

  if (!product) return null;

  const avgRating =
    product.reviews.length > 0
      ? Math.round(
          (product.reviews.reduce((sum, r) => sum + r.rating, 0) /
            product.reviews.length) *
            10,
        ) / 10
      : null;

  return {
    ...product,
    basePrice: Number(product.basePrice),
    variants: product.variants.map((v) => ({ ...v, price: Number(v.price) })),
    specs: product.specGroups,
    reviews: product.reviews,
    reviewCount: product._count.reviews,
    rating: avgRating,
  };
}

// ─── CLIENT SAFE — calls the API route over HTTP ───
// Safe to import in "use client" files

export async function getProductsClient(
  filters: ProductFilters,
): Promise<ProductsResult> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== false
    ) {
      params.set(key, String(value));
    }
  });

  const res = await fetch(`/api/products?${params}`);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}
