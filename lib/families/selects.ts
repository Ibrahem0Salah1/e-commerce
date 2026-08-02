import { Prisma } from "@prisma/client";

export const familyListSelect = {
  id: true,
  name: true,
  slug: true,
  isActive: true,
  categoryId: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  _count: {
    select: { products: true },
  },
} satisfies Prisma.ProductFamilySelect;

export type FamilyListRaw = Prisma.ProductFamilyGetPayload<{
  select: typeof familyListSelect;
}>;

export const familyDetailSelect = {
  id: true,
  name: true,
  slug: true,
  isActive: true,
  categoryId: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  _count: {
    select: { products: true },
  },
} satisfies Prisma.ProductFamilySelect;

export type FamilyDetailRaw = Prisma.ProductFamilyGetPayload<{
  select: typeof familyDetailSelect;
}>;
