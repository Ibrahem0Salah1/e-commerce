import "server-only";
import prisma from "@/lib/config/prisma";
import type { AdminProductDetail, ProductListItem } from "@/lib/types";
import { productListSelect } from "@/lib/products/selects";
import { adminProductDetailSelect } from "@/lib/admin/selects";

export async function getAdminAllProducts(): Promise<ProductListItem[]> {
  console.log("[QUERY] getAdminAllProducts - hitting DB");

  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    select: productListSelect,
  });

  return products.map(({ reviews, _count, variants, basePrice, description, ...rest }) => {
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

  return {
    ...product,
    basePrice: Number(product.basePrice),
    variants: product.variants.map((v) => ({ ...v, price: Number(v.price) })),
  };
}
