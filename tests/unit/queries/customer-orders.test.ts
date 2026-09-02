import { describe, it, expect, vi, beforeEach } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";

const { findManyMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
}));
vi.mock("@/lib/config/prisma", () => ({
  default: { order: { findMany: findManyMock, findFirst: vi.fn() } },
}));

import { getCustomerOrders, getCustomerOrderDetail } from "@/lib/orders/queries";

function orderRow(costPriceAtSale: Decimal | null = new Decimal("60")) {
  return {
    id: "o1",
    status: "PENDING",
    paymentStatus: "UNPAID",
    paymentMethod: "COD",
    subtotal: new Decimal("200"),
    discountAmount: new Decimal("0"),
    shippingPrice: new Decimal("20"),
    total: new Decimal("220"),
    shippingCity: "Cairo",
    createdAt: new Date("2026-01-01"),
    items: [
      {
        id: "i1",
        productId: "p1",
        productName: "Amalgam",
        variantName: "M",
        unitPrice: new Decimal("100"),
        totalPrice: new Decimal("200"),
        costPriceAtSale,
        quantity: 2,
        product: { images: ["https://r2.example.com/a.jpg"], slug: "amalgam" },
      },
    ],
  };
}

describe("getCustomerOrders — costPriceAtSale stripped, pagination", () => {
  beforeEach(() => vi.clearAllMocks());

  it("never exposes costPriceAtSale to customer (always null)", async () => {
    findManyMock.mockResolvedValue([orderRow()]);
    const rows = await getCustomerOrders("user1");
    expect(rows[0].items[0].costPriceAtSale).toBeNull();
  });

  it("strips even when DB has null (still null)", async () => {
    findManyMock.mockResolvedValue([orderRow(null)]);
    const rows = await getCustomerOrders("user1");
    expect(rows[0].items[0].costPriceAtSale).toBeNull();
  });

  it("caps limit to 100 and defaults 50", async () => {
    findManyMock.mockResolvedValue([]);
    await getCustomerOrders("user1", { limit: 999 });
    expect(findManyMock).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));
    vi.clearAllMocks();
    await getCustomerOrders("user1");
    expect(findManyMock).toHaveBeenCalledWith(expect.objectContaining({ take: 50 }));
  });
});

describe("getCustomerOrderDetail — also strips cost", () => {
  it("returns null costPriceAtSale", async () => {
    const { getCustomerOrderDetail: fn } = await import("@/lib/orders/queries");
    const prisma = (await import("@/lib/config/prisma")).default as unknown as { order: { findFirst: ReturnType<typeof vi.fn> } };
    prisma.order.findFirst = vi.fn().mockResolvedValue(orderRow(new Decimal("60")));
    const r = await fn("user1", "o1");
    expect(r?.items[0].costPriceAtSale).toBeNull();
  });
});
