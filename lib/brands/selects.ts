import { Prisma } from "@prisma/client";

export const brandListSelect = {
  id: true,
  name: true,
  slug: true,
  logo: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: { products: true },
  },
} satisfies Prisma.BrandSelect;

export type BrandListRaw = Prisma.BrandGetPayload<{
  select: typeof brandListSelect;
}>;

export const brandDetailSelect = {
  id: true,
  name: true,
  slug: true,
  logo: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: { products: true },
  },
} satisfies Prisma.BrandSelect;

export type BrandDetailRaw = Prisma.BrandGetPayload<{
  select: typeof brandDetailSelect;
}>;
