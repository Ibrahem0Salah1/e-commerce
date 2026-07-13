import { Prisma } from "@prisma/client";

export const testimonialSelect = {
  id: true,
  rating: true,
  title: true,
  body: true,
  verifiedPurchase: true,
  createdAt: true,
  user: { select: { id: true, name: true, image: true } },
  product: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ReviewSelect;

export type TestimonialRaw = Prisma.ReviewGetPayload<{
  select: typeof testimonialSelect;
}>;
