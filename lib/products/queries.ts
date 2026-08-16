// lib/products/queries.ts
import "server-only";
import prisma from "@/lib/config/prisma";
import { Prisma } from "@prisma/client";
import { getCached } from "@/lib/config/redis";
import type {
  ProductDetail,
  ProductListItem,
  ProductsResult,
} from "@/lib/types";
import type { ProductFilters } from "@/lib/products/filters";
import {
  productListDisplaySelect,
  productDetailDisplaySelect,
} from "@/lib/products/selects";

// ============================================================================
// DISPLAY QUERIES (CACHED IN REDIS — NO STOCK)
// ============================================================================

async function queryProductsDisplay(filters: ProductFilters) {
  console.log(
    `[DB QUERY] queryProductsDisplay — page ${filters.page}, cat: ${filters.category || "all"}, fam: ${filters.family || "all"}, brand: ${filters.brand || "all"}`,
  );

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    archived: false,
    ...(filters.family && { family: { slug: filters.family } }),
    ...(filters.category && !filters.family && { family: { category: { slug: filters.category } } }),
    ...(filters.brand && { brand: { slug: filters.brand } }),
    ...(filters.featured && { featured: true }),
    ...(filters.q && { name: { contains: filters.q, mode: "insensitive" } }),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    filters.sort === "price_asc"
      ? { price: "asc" }
      : filters.sort === "price_desc"
        ? { price: "desc" }
        : filters.sort === "name"
          ? { name: "asc" }
          : { createdAt: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      select: productListDisplaySelect,
    }),
    prisma.product.count({ where }),
  ]);

  const data = products.map(
    ({ reviews, _count, price, description, family, ...rest }) => {
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

function buildListCacheKey(filters: ProductFilters): string {
  return `products:list:q=${filters.q}:cat=${filters.category}:fam=${filters.family}:brand=${filters.brand}:feat=${filters.featured}:sort=${filters.sort}:page=${filters.page}:limit=${filters.limit}`;
}

/** Cached product list (display data only, no stock). TTL: 1 hour. */
export async function getProductsServer(filters: ProductFilters) {
  const key = buildListCacheKey(filters);
  //7200 = 2 hours
  return getCached(key, () => queryProductsDisplay(filters), 7200);
}

/** Cached featured products (display only). TTL: 1 hour. */
export async function getFeaturedProducts() {
  return getCached(
    "products:featured",
    async () => {
      const products = await prisma.product.findMany({
        where: { isActive: true, archived: false, featured: true },
        orderBy: { name: "asc" },
        take: 8,
        select: productListDisplaySelect,
      });

      return products.map(
        ({ reviews, _count, price, description, family, ...rest }) => {
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
            reviewCount: _count.reviews,
            rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
          };
        },
      );
    },
    10800, //3 hours
  );
}

/** Cached bestseller products (display only). TTL: 1 hour. */
export async function getBestsellerProducts() {
  return getCached(
    "products:bestseller",
    async () => {
      const products = await prisma.product.findMany({
        where: { isActive: true, archived: false, bestSeller: true },
        orderBy: { name: "asc" },
        take: 8,
        select: productListDisplaySelect,
      });

      return products.map(
        ({ reviews, _count, price, description, family, ...rest }) => {
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
            reviewCount: _count.reviews,
            rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
          };
        },
      );
    },
    10800, //3 hours
  );
}

/** Cached all products (display only). TTL: 1 hour. */
export async function getAllProducts() {
  return getCached(
    "products:all",
    async () => {
      const products = await prisma.product.findMany({
        where: { isActive: true, archived: false },
        orderBy: { name: "asc" },
        select: productListDisplaySelect,
      });

      return products.map(
        ({ reviews, _count, price, description, family, ...rest }) => {
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
            reviewCount: _count.reviews,
            rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
          };
        },
      );
    },
    7200,
  );
}

/** Cached product detail (display only, no stock). TTL: 24 hours. */
export async function getProductBySlug(slug: string) {
  return getCached(
    `product:detail:${slug}`,
    async () => {
      console.log(`[DB QUERY] getProductBySlug — slug: ${slug}`);

      const product = await prisma.product.findUnique({
        where: { slug, isActive: true },
        select: productDetailDisplaySelect,
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

      const { family, attributeValues, ...productData } = product;

      return {
        ...productData,
        category: family?.category ?? null,
        family: family ? { id: family.id, name: family.name, slug: family.slug } : null,
        price: Number(product.price),
        attributes: attributeValues.map((av) => ({
          typeName: av.attributeType.name,
          typeSlug: av.attributeType.slug,
          value: av.attributeValue.value,
          valueSlug: av.attributeValue.slug,
        })),
        specs: product.specGroups,
        reviewCount: product._count.reviews,
        rating: avgRating,
      };
    },
    86400,
  );
}

// ============================================================================
// INVENTORY QUERIES (NO CACHE — ALWAYS FRESH FROM DB)
// ============================================================================

/** Fetch fresh stock for multiple products. No caching. */
export async function getProductsInventory(productIds: string[]): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map();

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, stock: true },
  });

  const map = new Map<string, number>();
  for (const p of products) {
    map.set(p.id, Number(p.stock ?? 0));
  }
  return map;
}

/** Fetch fresh stock for a single product by slug. No caching. */
export async function getProductInventory(slug: string): Promise<number> {
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { stock: true },
  });
  return Number(product?.stock ?? 0);
}

// ============================================================================
// MERGE HELPERS (combine cached display + fresh inventory)
// ============================================================================

export function mergeInventoryIntoProducts<T extends { id: string }>(
  products: T[],
  inventoryMap: Map<string, number>,
): (T & { stock: number })[] {
  return products.map((p) => ({
    ...p,
    stock: inventoryMap.get(p.id) ?? 0,
  }));
}

export function mergeInventoryIntoProduct<T>(
  product: T,
  stock: number,
): T & { stock: number } {
  return { ...product, stock };
}

// ============================================================================
// SERVER-SIDE WRAPPERS (display + inventory merged for SSR)
// Use these in page.tsx server components so initialData has stock.
// ============================================================================

export async function getProductsServerWithInventory(filters: ProductFilters): Promise<ProductsResult> {
  const displayData = await getProductsServer(filters);
  const productIds = displayData.products.map((p : {id:string}) => p.id);
  const inventoryMap = await getProductsInventory(productIds);
  const productsWithStock = mergeInventoryIntoProducts(displayData.products as ProductListItem[], inventoryMap);

  return {
    products: productsWithStock as ProductListItem[],
    pagination: displayData.pagination,
  };
}

export async function getProductBySlugWithInventory(slug: string): Promise<ProductDetail | null> {
  const [productDisplay, stock] = await Promise.all([
    getProductBySlug(slug),
    getProductInventory(slug),
  ]);

  if (!productDisplay) return null;
  return mergeInventoryIntoProduct(productDisplay, stock) as ProductDetail;
}