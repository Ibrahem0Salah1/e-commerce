import { Prisma } from "@prisma/client";

export const categoryListSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  image: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      families: true,
      products: true,
    },
  },
} satisfies Prisma.CategorySelect;

export type CategoryListRaw = Prisma.CategoryGetPayload<{
  select: typeof categoryListSelect;
}>;

export const categoryDetailSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  image: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      families: true,
      products: true,
    },
  },
  families: {
    orderBy: { name: "asc" as const },
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      _count: {
        select: { products: true },
      },
    },
  },
} satisfies Prisma.CategorySelect;

export type CategoryDetailRaw = Prisma.CategoryGetPayload<{
  select: typeof categoryDetailSelect;
}>;

export const categoryOptionSelect = {
  id: true,
  name: true,
  slug: true,
} satisfies Prisma.CategorySelect;

export type CategoryOptionRaw = Prisma.CategoryGetPayload<{
  select: typeof categoryOptionSelect;
}>;

export const categoryWithFamiliesSelect = {
  id: true,
  name: true,
  slug: true,
  families: {
    orderBy: { name: "asc" as const },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} satisfies Prisma.CategorySelect;

export type CategoryWithFamiliesRaw = Prisma.CategoryGetPayload<{
  select: typeof categoryWithFamiliesSelect;
}>;
