import "server-only";
import prisma from "@/lib/config/prisma";
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import type {
  ProductDetail,
  ProductListItem,
  ProductsResult,
} from "@/lib/types";
import type { ProductFilters } from "@/lib/products/filters";

async function queryProducts(filters: ProductFilters): Promise<ProductsResult> {
  console.log(
    `[CACHE MISS] queryProducts - page ${filters.page}, category: ${filters.category || "all"}, brand: ${filters.brand || "all"}, q: ${filters.q || ""}`,
  );

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    archived: false,
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
  ["products-list"],
  { revalidate: 3600, tags: ["products"] },
);

export const getFeaturedProducts = unstable_cache(
  async (): Promise<ProductListItem[]> => {
    console.log("[CACHE MISS] getFeaturedProducts - hitting DB");

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
  ["products-featured"],
  { revalidate: 3600, tags: ["products"] },
);

export const getProductBySlug = unstable_cache(
  async (slug: string): Promise<ProductDetail | null> => {
    console.log(`[CACHE MISS] getProductBySlug - slug: ${slug}`);

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
              select: { id: true, key: true, value: true },
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
      variants: product.variants.map((v) => ({
        ...v,
        price: Number(v.price),
      })),
      specs: product.specGroups,
      reviews: product.reviews,
      reviewCount: product._count.reviews,
      rating: avgRating,
    };
  },
  ["product-detail"],
  { revalidate: 3600, tags: ["products"] },
);

export const getAllProducts = unstable_cache(
  async (): Promise<ProductListItem[]> => {
    console.log("[CACHE MISS] getAllProducts - hitting DB");

    const products = await prisma.product.findMany({
      where: { isActive: true, archived: false },
      orderBy: { name: "asc" },
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
    });

    return products.map(({ reviews, _count, variants, basePrice, ...rest }) => {
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
    });
  },
  ["products-all"],
  { revalidate: 3600, tags: ["products"] },
);
