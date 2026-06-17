import prisma from "@/lib/prisma";
import type { ProductDetail, ProductFilters, ProductListItem, ProductsResult } from "./types";

export async function getProducts(
  filters: ProductFilters,
): Promise<ProductsResult> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/products?${params}`);

  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }

  return res.json();
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
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
        select: { id: true, name: true, sku: true, price: true, stock: true, image: true, isActive: true },
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
        select: { id: true, rating: true, title: true, body: true, createdAt: true, user: { select: { name: true, image: true } } },
      },
      _count: { select: { reviews: true } },
    },
  });

  if (!product) return null;

  const reviews = product.reviews;
  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : null;

  return {
    ...product,
    basePrice: Number(product.basePrice),
    variants: product.variants.map((v) => ({ ...v, price: Number(v.price) })),
    specs: product.specGroups,
    reviews,
    reviewCount: product._count.reviews,
    rating: avgRating,
  };
}

export async function getFeaturedProducts(): Promise<ProductListItem[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/products?featured=true&limit=4`);

  if (!res.ok) {
    throw new Error("Failed to fetch featured products");
  }

  const data = await res.json();
  return data.products;
}
