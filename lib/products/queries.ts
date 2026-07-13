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
import { productListSelect, productDetailSelect } from "@/lib/products/selects";

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
      select: productListSelect,
    }),
    prisma.product.count({ where }),
  ]);

  const data = products.map(
    ({ reviews, _count, variants, basePrice, description, ...rest }) => {
      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : null;

      return {
        ...rest,
        description: description ?? [],
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
      select: productDetailSelect,
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
      select: productListSelect,
    });

    return products.map(
      ({ reviews, _count, variants, basePrice, description, ...rest }) => {
        const avgRating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : null;

        return {
          ...rest,
          description: description ?? [],
          basePrice: Number(basePrice),
          variants: variants.map((v) => ({ ...v, price: Number(v.price) })),
          variantCount: _count.variants,
          reviewCount: _count.reviews,
          rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        };
      },
    );
  },
  ["products-all"],
  { revalidate: 3600, tags: ["products"] },
);
