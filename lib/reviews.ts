import { Testimonial } from "@/lib/types";
import prisma from "@/lib/prisma";

export async function getTestimonials(limit = 6): Promise<Testimonial[]> {
  const reviews = await prisma.review.findMany({
    where: {
      isVisible: true,
      rating: { gte: 4 },
    },
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      verifiedPurchase: true,
      createdAt: true,
      user: { select: { id: true, name: true, image: true } },
      product: { select: { id: true, name: true, slug: true } },
    },
  });

  return reviews.map((review) => ({
    ...review,
    createdAt: review.createdAt.toISOString(),
  }));
}
