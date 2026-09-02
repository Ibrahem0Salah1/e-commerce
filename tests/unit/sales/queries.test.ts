import { describe, it, expect, vi, beforeEach } from "vitest";

const { requireAdminMock, queryRawMock, findFirstMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  queryRawMock: vi.fn(),
  findFirstMock: vi.fn(),
}));

vi.mock("@/lib/auth/authz", () => ({ requireAdmin: requireAdminMock }));
vi.mock("@/lib/config/prisma", () => ({
  default: {
    $queryRaw: queryRawMock,
    order: { findFirst: findFirstMock },
  },
}));

// Prisma.sql is used as template tag — mock to passthrough for unit tests
vi.mock("@prisma/client", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    Prisma: {
      sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
      join: (arr: unknown[], sep: string) => ({ arr, sep }),
      empty: {},
    },
  };
});

import {
  getSalesSummary,
  getSalesTimeSeries,
  getProductProfitability,
  getEarliestSaleDate,
} from "@/lib/sales/queries";

describe("lib/sales/queries — auth guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ user: { id: "admin" } });
  });

  it("getSalesSummary requires admin", async () => {
    requireAdminMock.mockRejectedValue(new Error("NEXT_REDIRECT:/admin/login"));
    queryRawMock.mockResolvedValue([]);
    await expect(getSalesSummary({})).rejects.toThrow("NEXT_REDIRECT");
  });

  it("getSalesSummary — revenue=subtotal, margin null when unknownCostItems>0 (ans2)", async () => {
    queryRawMock.mockResolvedValue([
      { revenue: "1000", shipping: "50", ordercount: "5", totalunits: "10", cogs: "600", unknownitems: "2", unknownorders: "1" },
    ]);
    const r = await getSalesSummary({});
    expect(r.revenue).toBe(1000);
    expect(r.cogs).toBe(600);
    expect(r.profit).toBe(400);
    // ans2: any unknown → margin null
    expect(r.marginPercent).toBeNull();
    expect(r.unknownCostItems).toBe(2);
  });

  it("getSalesSummary — margin computed when no unknown", async () => {
    queryRawMock.mockResolvedValue([
      { revenue: "1000", shipping: "0", ordercount: "2", totalunits: "5", cogs: "400", unknownitems: "0", unknownorders: "0" },
    ]);
    const r = await getSalesSummary({});
    expect(r.marginPercent).toBeCloseTo(60, 5);
  });

  it("getSalesSummary — orderCount 0 → margin null", async () => {
    queryRawMock.mockResolvedValue([
      { revenue: "0", shipping: "0", ordercount: "0", totalunits: "0", cogs: "0", unknownitems: "0", unknownorders: "0" },
    ]);
    const r = await getSalesSummary({});
    expect(r.marginPercent).toBeNull();
  });

  it("getProductProfitability — margin null when unknownCostQty>0", async () => {
    queryRawMock.mockResolvedValue([
      { productId: "p1", productName: "Amalgam", productSlug: "amalgam", qtySold: "10", revenue: "1000", cogs: "600", unknownQty: "3", orderCount: "5" },
    ]);
    const rows = await getProductProfitability({ limit: 10, sortBy: "profit" });
    expect(rows[0].marginPercent).toBeNull();
    expect(rows[0].unknownCostQty).toBe(3);
  });

  it("getProductProfitability — margin computed when known", async () => {
    queryRawMock.mockResolvedValue([
      { productId: "p1", productName: "Amalgam", productSlug: "amalgam", qtySold: "10", revenue: "1000", cogs: "400", unknownQty: "0", orderCount: "5" },
    ]);
    const rows = await getProductProfitability({});
    expect(rows[0].marginPercent).toBeCloseTo(60, 5);
  });

  it("getSalesTimeSeries — margin null per bucket when unknownitems>0", async () => {
    queryRawMock.mockResolvedValue([
      { bucket: new Date("2026-01-01"), revenue: "500", shipping: "10", cogs: "300", ordercount: "2", unknownitems: "1" },
      { bucket: new Date("2026-01-02"), revenue: "500", shipping: "10", cogs: "200", ordercount: "2", unknownitems: "0" },
    ]);
    const rows = await getSalesTimeSeries({ granularity: "day" });
    expect(rows[0].marginPercent).toBeNull();
    expect(rows[1].marginPercent).toBeCloseTo(60, 5);
  });

  it("getEarliestSaleDate delegates to prisma.order.findFirst", async () => {
    const d = new Date("2026-01-01");
    findFirstMock.mockResolvedValue({ paidAt: d });
    const r = await getEarliestSaleDate();
    expect(r).toEqual(d);
    findFirstMock.mockResolvedValue(null);
    expect(await getEarliestSaleDate()).toBeNull();
  });
});
