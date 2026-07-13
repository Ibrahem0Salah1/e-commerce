import type { Testimonial } from "@/lib/types";
import prisma from "@/lib/config/prisma";
import { testimonialSelect } from "@/lib/reviews/selects";

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
