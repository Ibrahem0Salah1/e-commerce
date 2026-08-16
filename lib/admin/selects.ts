import { Prisma } from "@prisma/client";

export const adminProductsListSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  stock: true,
  sku: true,
  images: true,
  madeIn: true,
  featured: true,
  bestSeller: true,
  isActive: true,
  archived: true,
  createdAt: true,
  family: {
    select: {
      id: true,
      name: true,
      slug: true,
      category: { select: { id: true, name: true, slug: true } },
    },
  },
  brand: { select: { id: true, name: true, slug: true, logo: true } },
  reviews: { select: { rating: true } },
  _count: { select: { reviews: true } },
} satisfies Prisma.ProductSelect;

export type AdminProductListRaw = Prisma.ProductGetPayload<{
  select: typeof adminProductsListSelect;
}>;

export const adminProductDetailSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  madeIn: true,
  price: true,
  stock: true,
  sku: true,
  images: true,
  featured: true,
  bestSeller: true,
  isActive: true,
  archived: true,
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
      attributeTypeId: true,
      attributeType: { select: { id: true, name: true, slug: true } },
      attributeValueId: true,
      attributeValue: { select: { id: true, value: true, slug: true } },
    },
  },
  specGroups: {
    orderBy: { position: "asc" as const },
    select: {
      id: true,
      name: true,
      position: true,
      specs: {
        orderBy: { position: "asc" as const },
        select: { id: true, key: true, value: true, position: true },
      },
    },
  },
  _count: { select: { reviews: true } },
} satisfies Prisma.ProductSelect;

export type AdminProductDetailRaw = Prisma.ProductGetPayload<{
  select: typeof adminProductDetailSelect;
}>;

