import { Prisma } from "@prisma/client";

export const adminProductDetailSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  madeIn: true,
  basePrice: true,
  images: true,
  featured: true,
  bestSeller: true,
  isActive: true,
  archived: true,
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true, logo: true } },
  variants: {
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

export const variantDetailSelect = {
  id: true,
  name: true,
  sku: true,
  price: true,
  stock: true,
  isLimitedQuantity: true,
  image: true,
  isActive: true,
  archived: true,
  createdAt: true,
  updatedAt: true,
  productId: true,
  product: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.VariantSelect;

export type VariantDetailRaw = Prisma.VariantGetPayload<{
  select: typeof variantDetailSelect;
}>;
