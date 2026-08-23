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

import { updateProductAndInvalidate } from "@/lib/admin/actions";

const validPayload = () => ({
  name: "Amalgam Capsule",
  description: ["Line one", "Line two"],
  madeIn: null,
  images: ["https://r2.example.com/a.jpg"],
  categoryId: "cat1",
  familyId: "fam1",
  brandId: null,
  isActive: true,
  archived: false,
  featured: false,
  bestSeller: true,
  price: 120,
  stock: 15,
  sku: "AMG-1",
  attributes: [{ attributeTypeId: "t1", attributeValueId: "v1" }],
  specGroups: [
    { name: "Physical", position: 0, specs: [{ key: "k", value: "v", position: 0 }] },
  ],
});

describe("updateProductAndInvalidate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ user: { id: "admin", role: "ADMIN" } });
    prismaMock.$transaction.mockImplementation(
      (cb: (tx: typeof prismaMock) => Promise<unknown>) => cb(prismaMock),
    );
    prismaMock.product.update.mockResolvedValue({ id: "p1", slug: "updated-slug" });
  });

  it("guards with requireAdmin before doing any work", async () => {
    requireAdminMock.mockRejectedValue(new Error("NEXT_REDIRECT:/admin/login"));
    await expect(
      updateProductAndInvalidate("p1", validPayload()),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(requireAdminMock).toHaveBeenCalledTimes(1);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("throws on an invalid payload without touching the database", async () => {
    await expect(
      updateProductAndInvalidate("p1", { name: "" }),
    ).rejects.toThrow();
    expect(prismaMock.product.update).not.toHaveBeenCalled();
  });

  it("runs the update inside a transaction", async () => {
    await updateProductAndInvalidate("p1", validPayload());
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  it("updates the product with normalized family/sku", async () => {
    await updateProductAndInvalidate("p1", validPayload());
    expect(prismaMock.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "p1" },
        data: expect.objectContaining({
          familyId: "fam1",
          sku: "AMG-1",
          categoryId: "cat1",
          name: "Amalgam Capsule",
        }),
      }),
    );
  });

  it("normalizes an empty familyId to null", async () => {
    await updateProductAndInvalidate("p1", {
      ...validPayload(),
      familyId: "",
    });
    const [arg] = prismaMock.product.update.mock.calls[0] as [
      { data: { familyId: string | null; sku: string | null } },
    ];
    expect(arg.data.familyId).toBeNull();
  });

  it("normalizes a null familyId to null", async () => {
    await updateProductAndInvalidate("p1", {
      ...validPayload(),
      familyId: null,
    });
    const [arg] = prismaMock.product.update.mock.calls[0] as [
      { data: { familyId: string | null } },
    ];
    expect(arg.data.familyId).toBeNull();
  });

  it("normalizes an empty sku to null", async () => {
    await updateProductAndInvalidate("p1", { ...validPayload(), sku: "" });
    const [arg] = prismaMock.product.update.mock.calls[0] as [
      { data: { sku: string | null } },
    ];
    expect(arg.data.sku).toBeNull();
  });

  it("normalizes a null sku to null", async () => {
    await updateProductAndInvalidate("p1", { ...validPayload(), sku: null });
    const [arg] = prismaMock.product.update.mock.calls[0] as [
      { data: { sku: string | null } },
    ];
    expect(arg.data.sku).toBeNull();
  });

  it("deletes and recreates attribute values when provided", async () => {
    const attributes = [
      { attributeTypeId: "t1", attributeValueId: "v1" },
      { attributeTypeId: "t2", attributeValueId: "v2" },
    ];
    await updateProductAndInvalidate("p1", { ...validPayload(), attributes });

    expect(prismaMock.productAttributeValue.deleteMany).toHaveBeenCalledWith({
      where: { productId: "p1" },
    });
    expect(prismaMock.productAttributeValue.createMany).toHaveBeenCalledWith({
      data: attributes.map((a) => ({ productId: "p1", ...a })),
    });
  });

  it("clears attributes when an empty array is sent (removal persists)", async () => {
    await updateProductAndInvalidate("p1", {
      ...validPayload(),
      attributes: [],
    });
    expect(prismaMock.productAttributeValue.deleteMany).toHaveBeenCalled();
    expect(prismaMock.productAttributeValue.createMany).not.toHaveBeenCalled();
  });

  it("preserves existing attributes when the field is absent", async () => {
    const { attributes: _omit, ...rest } = validPayload();
    await updateProductAndInvalidate("p1", rest);
    expect(prismaMock.productAttributeValue.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.productAttributeValue.createMany).not.toHaveBeenCalled();
  });

  it("recreates spec groups with their specs", async () => {
    await updateProductAndInvalidate("p1", validPayload());
    expect(prismaMock.specificationGroup.deleteMany).toHaveBeenCalledWith({
      where: { productId: "p1" },
    });
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

  it("skips spec groups that have no specs", async () => {
    await updateProductAndInvalidate("p1", {
      ...validPayload(),
      specGroups: [{ name: "Empty", position: 0, specs: [] }],
    });
    expect(prismaMock.specificationGroup.deleteMany).toHaveBeenCalled();
    expect(prismaMock.specificationGroup.create).not.toHaveBeenCalled();
  });

  it("clears spec groups when an empty array is sent", async () => {
    await updateProductAndInvalidate("p1", {
      ...validPayload(),
      specGroups: [],
    });
    expect(prismaMock.specificationGroup.deleteMany).toHaveBeenCalled();
    expect(prismaMock.specificationGroup.create).not.toHaveBeenCalled();
  });

  it("preserves existing spec groups when the field is absent", async () => {
    const { specGroups: _omit, ...rest } = validPayload();
    await updateProductAndInvalidate("p1", rest);
    expect(prismaMock.specificationGroup.deleteMany).not.toHaveBeenCalled();
  });

  it("invalidates the product detail and products list caches", async () => {
    await updateProductAndInvalidate("p1", validPayload());
    expect(invalidateCacheMock).toHaveBeenCalledWith(
      "product:detail:updated-slug",
    );
    expect(invalidatePatternMock).toHaveBeenCalledWith("products:*");
  });
});
