import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only so vitest can import the module
vi.mock("server-only", () => ({}));

// Mock unstable_cache to just return the inner function (no caching in tests)
vi.mock("next/cache", () => ({
  unstable_cache: (fn: Function) => fn,
}));

// Mock prisma
vi.mock("@/lib/config/prisma", () => ({
  default: {
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import prisma from "@/lib/config/prisma";
import {
  getProductsServer,
  getFeaturedProducts,
  getProductBySlug,
  getAllProducts,
  getBestsellerProducts,
} from "@/lib/products/queries";
import type { ProductFilters } from "@/lib/products/filters";

const defaultFilters: ProductFilters = {
  q: "",
  category: "",
  family: "",
  brand: "",
  featured: false,
  sort: "name",
  page: 1,
  limit: 20,
};

function makeRawProduct(overrides: Record<string, any> = {}) {
  return {
    id: "prod-1",
    name: "Test Product",
    slug: "test-product",
    description: ["A great product"],
    price: 220,
    stock: 50,
    images: ["/img.jpg"],
    featured: false,
    isActive: true,
    family: {
      id: "fam-1",
      name: "Gloves",
      slug: "gloves",
      category: { id: "cat-1", name: "Disposables", slug: "disposables" },
    },
    brand: null,
    reviews: [{ rating: 5 }, { rating: 4 }, { rating: 3 }],
    _count: { reviews: 3 },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── getProductsServer ───────────────────────────────────────────────────────

describe("getProductsServer", () => {
  it("returns products with correct shape", async () => {
    const rawProduct = makeRawProduct();
    vi.mocked(prisma.product.findMany).mockResolvedValue([rawProduct] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(1);

    const result = await getProductsServer(defaultFilters);

    expect(result.products).toHaveLength(1);
    expect(result.products[0].name).toBe("Test Product");
    expect(result.products[0].price).toBe(220);
    expect(result.products[0].category).toEqual({
      id: "cat-1",
      name: "Disposables",
      slug: "disposables",
    });
    expect(result.products[0].family).toEqual({
      id: "fam-1",
      name: "Gloves",
      slug: "gloves",
    });
  });

  it("calculates average rating correctly", async () => {
    const rawProduct = makeRawProduct({
      reviews: [{ rating: 5 }, { rating: 4 }, { rating: 3 }],
    });
    vi.mocked(prisma.product.findMany).mockResolvedValue([rawProduct] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(1);

    const result = await getProductsServer(defaultFilters);
    // (5 + 4 + 3) / 3 = 4.0, rounded to 1 decimal
    expect(result.products[0].rating).toBe(4);
  });

  it("returns null rating when no reviews", async () => {
    const rawProduct = makeRawProduct({ reviews: [] });
    vi.mocked(prisma.product.findMany).mockResolvedValue([rawProduct] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(1);

    const result = await getProductsServer(defaultFilters);
    expect(result.products[0].rating).toBeNull();
  });

  it("converts Decimal prices to numbers", async () => {
    const rawProduct = makeRawProduct({ price: 220.5 });
    vi.mocked(prisma.product.findMany).mockResolvedValue([rawProduct] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(1);

    const result = await getProductsServer(defaultFilters);
    expect(typeof result.products[0].price).toBe("number");
  });

  it("returns correct pagination", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(45);

    const result = await getProductsServer({
      ...defaultFilters,
      page: 2,
      limit: 10,
    });

    expect(result.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 45,
      totalPages: 5,
    });
  });

  it("applies category filter when family is not set", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await getProductsServer({
      ...defaultFilters,
      category: "disposables",
    });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          family: { category: { slug: "disposables" } },
        }),
      })
    );
  });

  it("applies family filter over category filter", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await getProductsServer({
      ...defaultFilters,
      category: "disposables",
      family: "gloves",
    });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          family: { slug: "gloves" },
        }),
      })
    );
  });

  it("applies brand filter", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await getProductsServer({
      ...defaultFilters,
      brand: "3m",
    });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          brand: { slug: "3m" },
        }),
      })
    );
  });

  it("applies featured filter", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await getProductsServer({
      ...defaultFilters,
      featured: true,
    });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ featured: true }),
      })
    );
  });

  it("applies search query filter", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await getProductsServer({
      ...defaultFilters,
      q: "gloves",
    });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          name: { contains: "gloves", mode: "insensitive" },
        }),
      })
    );
  });

  it("applies price_asc sort", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await getProductsServer({ ...defaultFilters, sort: "price_asc" });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { price: "asc" },
      })
    );
  });

  it("applies price_desc sort", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await getProductsServer({ ...defaultFilters, sort: "price_desc" });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { price: "desc" },
      })
    );
  });

  it("applies default createdAt desc sort for name sort", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await getProductsServer({ ...defaultFilters, sort: "name" });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: "asc" },
      })
    );
  });

  it("applies pagination with correct skip/take", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await getProductsServer({
      ...defaultFilters,
      page: 3,
      limit: 15,
    });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 30,
        take: 15,
      })
    );
  });

  it("always filters active, non-archived products", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await getProductsServer(defaultFilters);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isActive: true,
          archived: false,
        }),
      })
    );
  });

  it("returns empty array when no products match", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    const result = await getProductsServer(defaultFilters);
    expect(result.products).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.totalPages).toBe(0);
  });
});

// ─── getFeaturedProducts ─────────────────────────────────────────────────────

describe("getFeaturedProducts", () => {
  it("fetches featured products with correct filters", async () => {
    const rawProduct = makeRawProduct({ featured: true });
    vi.mocked(prisma.product.findMany).mockResolvedValue([rawProduct] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(1);

    const result = await getFeaturedProducts();

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ featured: true }),
        take: 8,
      })
    );
    expect(result).toHaveLength(1);
  });
});

// ─── getAllProducts ──────────────────────────────────────────────────────────

describe("getAllProducts", () => {
  it("returns all active, non-archived products", async () => {
    const rawProduct = makeRawProduct();
    vi.mocked(prisma.product.findMany).mockResolvedValue([rawProduct] as any);

    const result = await getAllProducts();

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true, archived: false },
        orderBy: { name: "asc" },
      })
    );
    expect(result).toHaveLength(1);
  });

  it("converts Decimal prices to numbers", async () => {
    const rawProduct = makeRawProduct({ price: 150.75 });
    vi.mocked(prisma.product.findMany).mockResolvedValue([rawProduct] as any);

    const result = await getAllProducts();
    expect(typeof result[0].price).toBe("number");
  });
});

// ─── getBestsellerProducts ──────────────────────────────────────────────────

describe("getBestsellerProducts", () => {
  it("fetches bestseller products", async () => {
    const rawProduct = makeRawProduct({ bestSeller: true });
    vi.mocked(prisma.product.findMany).mockResolvedValue([rawProduct] as any);

    const result = await getBestsellerProducts();

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ bestSeller: true }),
        take: 8,
      })
    );
    expect(result).toHaveLength(1);
  });
});

// ─── getProductBySlug ───────────────────────────────────────────────────────

describe("getProductBySlug", () => {
  it("returns product detail with correct shape", async () => {
    const rawProduct = {
      id: "prod-1",
      name: "Test Product",
      slug: "test-product",
      description: ["Desc"],
      price: 220,
      stock: 50,
      sku: "SKU-001",
      images: ["/img.jpg"],
      featured: false,
      family: {
        id: "fam-1",
        name: "Gloves",
        slug: "gloves",
        category: { id: "cat-1", name: "Disposables", slug: "disposables" },
      },
      brand: null,
      attributeValues: [
        {
          attributeType: { name: "Size", slug: "size" },
          attributeValue: { value: "Medium", slug: "medium" },
        },
      ],
      specGroups: [
        {
          name: "General",
          specs: [{ id: "s1", key: "Material", value: "Nitrile" }],
        },
      ],
      reviews: [
        {
          id: "r1",
          rating: 5,
          title: "Great",
          body: "Love it",
          createdAt: new Date("2026-01-01"),
          user: { name: "John", image: null },
        },
      ],
      _count: { reviews: 1 },
    };
    vi.mocked(prisma.product.findUnique).mockResolvedValue(rawProduct as any);

    const result = await getProductBySlug("test-product");

    expect(result).not.toBeNull();
    expect(result!.name).toBe("Test Product");
    expect(result!.price).toBe(220);
    expect(result!.category).toEqual({
      id: "cat-1",
      name: "Disposables",
      slug: "disposables",
    });
    expect(result!.attributes).toEqual([
      { typeName: "Size", typeSlug: "size", value: "Medium", valueSlug: "medium" },
    ]);
    expect(result!.specs).toHaveLength(1);
    expect(result!.specs[0].name).toBe("General");
    expect(result!.reviewCount).toBe(1);
    expect(result!.rating).toBe(5);
  });

  it("returns null when product not found", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

    const result = await getProductBySlug("nonexistent");
    expect(result).toBeNull();
  });

  it("calculates average rating for product detail", async () => {
    const rawProduct = {
      id: "prod-1",
      name: "Test",
      slug: "test",
      description: [],
      price: 100,
      stock: 10,
      images: [],
      featured: false,
      family: null,
      brand: null,
      attributeValues: [],
      specGroups: [],
      reviews: [{ rating: 4 }, { rating: 5 }, { rating: 3 }],
      _count: { reviews: 3 },
    };
    vi.mocked(prisma.product.findUnique).mockResolvedValue(rawProduct as any);

    const result = await getProductBySlug("test");
    // (4 + 5 + 3) / 3 = 4.0
    expect(result!.rating).toBe(4);
  });

  it("returns null rating when no reviews in detail", async () => {
    const rawProduct = {
      id: "prod-1",
      name: "Test",
      slug: "test",
      description: [],
      price: 100,
      stock: 10,
      images: [],
      featured: false,
      family: null,
      brand: null,
      attributeValues: [],
      specGroups: [],
      reviews: [],
      _count: { reviews: 0 },
    };
    vi.mocked(prisma.product.findUnique).mockResolvedValue(rawProduct as any);

    const result = await getProductBySlug("test");
    expect(result!.rating).toBeNull();
  });

  it("returns null category and family when family is null", async () => {
    const rawProduct = {
      id: "prod-1",
      name: "No Family Product",
      slug: "no-family",
      description: [],
      price: 100,
      stock: 10,
      images: [],
      featured: false,
      family: null,
      brand: null,
      attributeValues: [],
      specGroups: [],
      reviews: [],
      _count: { reviews: 0 },
    };
    vi.mocked(prisma.product.findUnique).mockResolvedValue(rawProduct as any);

    const result = await getProductBySlug("no-family");
    expect(result).not.toBeNull();
    expect(result!.category).toBeNull();
    expect(result!.family).toBeNull();
  });
});
