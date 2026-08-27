import type { Testimonial } from "@/lib/types";
import prisma from "@/lib/config/prisma";
import { testimonialSelect } from "@/lib/reviews/selects";

/**
 * Batched average rating for a set of products — ONE groupBy query instead of
 * loading every review row per product (the old N-rows-per-product payload).
 * Averages are rounded to 1 decimal; products with no reviews are absent.
 */
export async function getAverageRatingsByIds(
  productIds: string[],
): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map();

  const groups = await prisma.review.groupBy({
    by: ["productId"],
    _avg: { rating: true },
    where: { productId: { in: productIds } },
  });

  const map = new Map<string, number>();
  for (const group of groups) {
    if (group._avg.rating != null) {
      map.set(group.productId, Math.round(group._avg.rating * 10) / 10);
    }
  }
  return map;
}

export async function getTestimonials(limit = 6): Promise<Testimonial[]> {
  const reviews = await prisma.review.findMany({
    where: {
      isVisible: true,
      rating: { gte: 4 },
    },
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: testimonialSelect,
  });

  return reviews.map((review) => ({
    ...review,
    createdAt: review.createdAt.toISOString(),
  }));
}
