import { describe, it, expect, vi, beforeEach } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";

const { prismaMock } = vi.hoisted(() => {
  const prisma = {
    product: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    review: {
      groupBy: vi.fn(),
    },
  };
  return { prismaMock: prisma };
});

vi.mock("@/lib/config/prisma", () => ({ default: prismaMock }));

import { getAdminProducts } from "@/lib/admin/products";

const defaultFilters = {
  q: "",
  category: "",
  family: "",
  brand: "",
  featured: false,
  bestSeller: false,
  inStock: false,
  outOfStock: false,
  lowStock: false,
  sort: "name" as const,
  page: 1,
  limit: 20,
};

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: "p1",
    name: "Amalgam Capsule",
    slug: "amalgam-capsule",
    description: ["Line one", "Line two"],
    price: new Decimal("120.5"),
    stock: 3,
    sku: "AMG-1",
    images: ["https://r2.example.com/a.jpg"],
    madeIn: "Egypt",
    featured: true,
    bestSeller: true,
    isActive: true,
    archived: false,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    family: {
      id: "fam1",
      name: "Capsules",
      slug: "capsules",
      category: { id: "cat1", name: "Supplements", slug: "supplements" },
    },
    brand: { id: "b1", name: "Acme", slug: "acme", logo: null },
    _count: { reviews: 2 },
    ...overrides,
  };
}

describe("getAdminProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.product.findMany.mockResolvedValue([row()]);
    prismaMock.product.count.mockResolvedValue(45);
    // Batched ratings: one groupBy for the whole page
    prismaMock.review.groupBy.mockResolvedValue([
      { productId: "p1", _avg: { rating: 4.5 } },
    ]);
  });

  it("builds the where clause from search/category/brand/featured/bestSeller filters", async () => {
    await getAdminProducts({
      ...defaultFilters,
      q: "amal",
      category: "supplements",
      brand: "acme",
      featured: true,
      bestSeller: true,
    });

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          name: { contains: "amal", mode: "insensitive" },
          family: { category: { slug: "supplements" } },
          brand: { slug: "acme" },
          featured: true,
          bestSeller: true,
        },
      }),
    );
  });

  it("prioritizes the family filter over the category filter", async () => {
    await getAdminProducts({
      ...defaultFilters,
      category: "supplements",
      family: "capsules",
    });

    const [arg] = prismaMock.product.findMany.mock.calls[0] as [
      { where: { family: object } },
    ];
    expect(arg.where.family).toEqual({ slug: "capsules" });
  });

  it("applies the in-stock filter", async () => {
    await getAdminProducts({ ...defaultFilters, inStock: true });
    const [arg] = prismaMock.product.findMany.mock.calls[0] as [
      { where: { stock: object } },
    ];
    expect(arg.where.stock).toEqual({ gt: 0 });
  });

  it("applies the out-of-stock filter", async () => {
    await getAdminProducts({ ...defaultFilters, outOfStock: true });
    const [arg] = prismaMock.product.findMany.mock.calls[0] as [
      { where: { stock: object } },
    ];
    expect(arg.where.stock).toEqual({ lte: 0 });
  });

  it("applies the low-stock filter", async () => {
    await getAdminProducts({ ...defaultFilters, lowStock: true });
    const [arg] = prismaMock.product.findMany.mock.calls[0] as [
      { where: { stock: object } },
    ];
    expect(arg.where.stock).toEqual({ gt: 0, lt: 5 });
  });

  it.each([
    ["price_asc", { price: "asc" }],
    ["price_desc", { price: "desc" }],
    ["stock_asc", { stock: "asc" }],
    ["stock_desc", { stock: "desc" }],
    ["newest", { createdAt: "desc" }],
    ["name", { name: "asc" }],
  ] as const)("orders by %s", async (sort, orderBy) => {
    await getAdminProducts({ ...defaultFilters, sort });

    const [arg] = prismaMock.product.findMany.mock.calls[0] as [
      { orderBy: object },
    ];
    expect(arg.orderBy).toEqual(orderBy);
  });

  it("applies pagination and returns pagination metadata", async () => {
    const result = await getAdminProducts({
      ...defaultFilters,
      page: 3,
      limit: 20,
    });

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 40, take: 20 }),
    );
    expect(prismaMock.product.count).toHaveBeenCalledWith({
      where: expect.any(Object),
    });
    expect(result.pagination).toEqual({
      page: 3,
      limit: 20,
      total: 45,
      totalPages: 3,
    });
  });

  it("serializes rows into ProductListItem shape", async () => {
    const result = await getAdminProducts(defaultFilters);

    expect(result.products[0]).toMatchObject({
      id: "p1",
      name: "Amalgam Capsule",
      price: 120.5,
      stock: 3,
      sku: "AMG-1",
      madeIn: "Egypt",
      featured: true,
      bestSeller: true,
      archived: false,
      createdAt: "2026-01-01T00:00:00.000Z",
      category: { id: "cat1", name: "Supplements", slug: "supplements" },
      family: { id: "fam1", name: "Capsules", slug: "capsules" },
      brand: { id: "b1", name: "Acme", slug: "acme", logo: null },
      reviewCount: 2,
      rating: 4.5,
    });
  });

  it("fetches ratings with ONE batched groupBy instead of loading review rows", async () => {
    await getAdminProducts(defaultFilters);

    expect(prismaMock.review.groupBy).toHaveBeenCalledTimes(1);
    expect(prismaMock.review.groupBy).toHaveBeenCalledWith({
      by: ["productId"],
      _avg: { rating: true },
      where: { productId: { in: ["p1"] } },
    });
  });

  it("handles products without a family or brand", async () => {
    prismaMock.product.findMany.mockResolvedValue([
      row({ family: null, brand: null }),
    ]);
    prismaMock.review.groupBy.mockResolvedValue([]);

    const result = await getAdminProducts(defaultFilters);

    expect(result.products[0].category).toBeNull();
    expect(result.products[0].family).toBeNull();
    expect(result.products[0].brand).toBeNull();
    expect(result.products[0].rating).toBeNull();
  });
});
