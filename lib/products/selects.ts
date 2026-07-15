import { Prisma } from "@prisma/client";

export const productListSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  basePrice: true,
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
  variants: {
    where: { isActive: true },
    orderBy: { price: "asc" as const },
    select: { id: true, name: true, price: true, stock: true },
  },
  reviews: { select: { rating: true } },
  _count: { select: { reviews: true, variants: true } },
} satisfies Prisma.ProductSelect;

export type ProductListRaw = Prisma.ProductGetPayload<{
  select: typeof productListSelect;
}>;

export const productDetailSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  basePrice: true,
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
  variants: {
    where: { isActive: true },
    orderBy: { price: "asc" as const },
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      stock: true,
      image: true,
      isActive: true,
      archived: true,
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
  select: typeof productDetailSelect;
}>;
