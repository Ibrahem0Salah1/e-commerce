import { Prisma } from "@prisma/client";

export const productListDisplaySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  // stock: true, not used in cache rn
  sku: true,
  images: true,
  featured: true,
  isActive: true,
  family: {
    select: {
      id: true,
      name: true,
      slug: true,
      category: { select: { id: true, name: true, slug: true } },
    },
  },
  brand: { select: { id: true, name: true, slug: true, logo: true } },
  // ratings are fetched via one batched review.groupBy — see lib/reviews/queries.ts
  _count: { select: { reviews: true } },
} satisfies Prisma.ProductSelect;

export type ProductListRaw = Prisma.ProductGetPayload<{
  select: typeof productListDisplaySelect;
}>;

export const productDetailDisplaySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  // stock: true, not used in cache rn. comes fresh from db
  sku: true,
  images: true,
  featured: true,
  family: {
    select: {
      id: true,
      name: true,
      slug: true,
      category: { select: { id: true, name: true, slug: true } },
    },
  },
  brand: { select: { id: true, name: true, slug: true, logo: true } },
  attributeValues: {
    select: {
      attributeType: { select: { name: true, slug: true } },
      attributeValue: { select: { value: true, slug: true } },
    },
  },
  specGroups: {
    orderBy: { position: "asc" as const },
    select: {
      name: true,
      specs: {
        orderBy: { position: "asc" as const },
        select: { id: true, key: true, value: true },
      },
    },
  },
  reviews: {
    where: { isVisible: true },
    orderBy: { createdAt: "desc" as const },
    take: 10,
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      createdAt: true,
      user: { select: { name: true, image: true } },
    },
  },
  _count: { select: { reviews: true } },
} satisfies Prisma.ProductSelect;

export type ProductDetailRaw = Prisma.ProductGetPayload<{
  select: typeof productDetailDisplaySelect;
}>;
