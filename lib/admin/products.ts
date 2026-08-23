// lib/admin/products.ts
import "server-only";
import prisma from "@/lib/config/prisma";
import { Prisma } from "@prisma/client";
import type {
  AdminProductDetail,
  ProductListItem,
  ProductsResult,
} from "@/lib/types";
import type { ProductFilters } from "@/lib/products/filters";
import {
  adminProductDetailSelect,
  adminProductsListSelect,
  type AdminProductListRaw,
} from "@/lib/admin/selects";
import { getAverageRatingsByIds } from "@/lib/reviews/queries";
import { plain } from "../utils/serialize";

function mapAdminProductRow(
  row: AdminProductListRaw,
  ratingById: Map<string, number>,
): ProductListItem {
  const { _count, price, description, family, stock, sku, createdAt, ...rest } = row;

  return {
    ...rest,
    category: family?.category ?? null,
    family: family ? { id: family.id, name: family.name, slug: family.slug } : null,
    description: description ?? [],
    price: Number(price),
    stock: stock !== undefined ? Number(stock) : null,
    sku: sku ?? null,
    createdAt: new Date(createdAt).toISOString(),
    reviewCount: _count.reviews,
    rating: ratingById.get(row.id) ?? null,
  };
}

export async function getAdminProducts(
  filters: ProductFilters,
): Promise<ProductsResult> {
  const where: Prisma.ProductWhereInput = {
    ...(filters.q && { name: { contains: filters.q, mode: "insensitive" } }),
    ...(filters.category && !filters.family && { family: { category: { slug: filters.category } } }),
    ...(filters.family && { family: { slug: filters.family } }),
    ...(filters.brand && { brand: { slug: filters.brand } }),
    ...(filters.featured && { featured: true }),
    ...(filters.bestSeller && { bestSeller: true }),
    ...(filters.inStock && { stock: { gt: 0 } }),
    ...(filters.outOfStock && { stock: { lte: 0 } }),
    ...(filters.lowStock && { stock: { gt: 0, lt: 5 } }),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    filters.sort === "price_asc"
      ? { price: "asc" }
      : filters.sort === "price_desc"
        ? { price: "desc" }
        : filters.sort === "stock_asc"
          ? { stock: "asc" }
          : filters.sort === "stock_desc"
            ? { stock: "desc" }
            : filters.sort === "newest"
              ? { createdAt: "desc" }
              : { name: "asc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      select: adminProductsListSelect,
    }),
    prisma.product.count({ where }),
  ]);

  // ONE batched groupBy for the whole page instead of loading every rating row
  const ratingById = await getAverageRatingsByIds(products.map((p) => p.id));

  return plain({
    products: products.map((row) => mapAdminProductRow(row, ratingById)),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
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
