import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  requireAdminMock,
  invalidateCacheMock,
  invalidatePatternMock,
  prismaMock,
} = vi.hoisted(() => {
  const prisma = {
    $transaction: vi.fn(),
    product: {
      create: vi.fn(),
      update: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    productAttributeValue: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    specificationGroup: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
  };
  return {
    requireAdminMock: vi.fn(),
    invalidateCacheMock: vi.fn(),
    invalidatePatternMock: vi.fn(),
    prismaMock: prisma,
  };
});

vi.mock("@/lib/config/prisma", () => ({ default: prismaMock }));
vi.mock("@/lib/auth/authz", () => ({ requireAdmin: requireAdminMock }));
vi.mock("@/lib/config/redis", () => ({
  invalidateCache: invalidateCacheMock,
  invalidatePattern: invalidatePatternMock,
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

import { addProductAndInvalidate } from "@/lib/admin/actions";

const validPayload = () => ({
  name: "Amalgam A1 2g",
  slug: "amalgam-a1-2g",
  description: ["Line one", "Line two"],
  madeIn: "Germany",
  price: 120,
  stock: 15,
  sku: "AMG-1",
  images: ["https://r2.example.com/a.jpg"],
  categoryId: "cat1",
  familyId: "fam1",
  brandId: "br1",
  isActive: true,
  archived: false,
  featured: false,
  bestSeller: false,
  attributes: [{ attributeTypeId: "t1", attributeValueId: "v1" }],
  specGroups: [
    { name: "Physical", position: 0, specs: [{ key: "k", value: "v", position: 0 }] },
  ],
});

describe("addProductAndInvalidate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ user: { id: "admin", role: "ADMIN" } });
    prismaMock.$transaction.mockImplementation(
      (cb: (tx: typeof prismaMock) => Promise<unknown>) => cb(prismaMock),
    );
    prismaMock.product.create.mockResolvedValue({ id: "p1", slug: "created-slug" });
  });

  it("guards with requireAdmin before doing any work", async () => {
    requireAdminMock.mockRejectedValue(new Error("NEXT_REDIRECT:/admin/login"));
    await expect(addProductAndInvalidate(validPayload())).rejects.toThrow(
      "NEXT_REDIRECT",
    );
    expect(requireAdminMock).toHaveBeenCalledTimes(1);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("throws on an invalid payload without touching the database", async () => {
    await expect(addProductAndInvalidate({ name: "" })).rejects.toThrow();
    expect(prismaMock.product.create).not.toHaveBeenCalled();
  });

  it("creates the product with slug + category connect and sku", async () => {
    await addProductAndInvalidate(validPayload());
    expect(prismaMock.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Amalgam A1 2g",
          slug: "amalgam-a1-2g",
          price: 120,
          sku: "AMG-1",
          category: { connect: { id: "cat1" } },
          family: { connect: { id: "fam1" } },
          brand: { connect: { id: "br1" } },
        }),
      }),
    );
  });

  it("connects family and brand only when provided", async () => {
    const { familyId: _f, ...rest } = validPayload();
    await addProductAndInvalidate({ ...rest, brandId: null });
    const { data } = prismaMock.product.create.mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(data).not.toHaveProperty("family");
    expect(data).not.toHaveProperty("brand");
  });

  it("omits sku when empty", async () => {
    await addProductAndInvalidate({ ...validPayload(), sku: "" });
    const { data } = prismaMock.product.create.mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(data).not.toHaveProperty("sku");
  });

  it("creates attribute values when provided", async () => {
    await addProductAndInvalidate(validPayload());
    expect(prismaMock.productAttributeValue.createMany).toHaveBeenCalledWith({
      data: [
        {
          productId: "p1",
          attributeTypeId: "t1",
          attributeValueId: "v1",
        },
      ],
    });
  });

  it("does not create attribute values when attributes is empty or absent", async () => {
    await addProductAndInvalidate({ ...validPayload(), attributes: [] });
    expect(prismaMock.productAttributeValue.createMany).not.toHaveBeenCalled();
  });

  it("creates spec groups with their specs", async () => {
    await addProductAndInvalidate(validPayload());
    expect(prismaMock.specificationGroup.create).toHaveBeenCalledWith({
      data: {
        productId: "p1",
        name: "Physical",
        position: 0,
        specs: {
          create: [{ key: "k", value: "v", position: 0 }],
        },
      },
    });
  });

  it("skips spec groups with no specs", async () => {
    await addProductAndInvalidate({
      ...validPayload(),
      specGroups: [{ name: "Empty", position: 0, specs: [] }],
    });
    expect(prismaMock.specificationGroup.create).not.toHaveBeenCalled();
  });

  it("invalidates the products list and new product detail caches", async () => {
    await addProductAndInvalidate(validPayload());
    expect(invalidatePatternMock).toHaveBeenCalledWith("products:*");
    expect(invalidateCacheMock).toHaveBeenCalledWith(
      "product:detail:created-slug",
    );
  });
});
