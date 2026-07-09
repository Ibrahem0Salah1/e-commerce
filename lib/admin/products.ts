import prisma from "@/lib/config/prisma";
import type { ProductListItem } from "@/lib/types";

export async function getAdminAllProducts(): Promise<ProductListItem[]> {
  const products = await prisma.product.findMany({
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
}
