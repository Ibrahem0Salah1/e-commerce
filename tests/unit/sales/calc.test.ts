import { describe, it, expect } from "vitest";
import {
  calcItemProfit,
  calcOrderProfit,
  calcMarginPercent,
  calcShippingTotal,
} from "@/lib/sales/calc";

describe("calcItemProfit", () => {
  it("computes profit and margin when cost is known", () => {
    const r = calcItemProfit({ unitPrice: 100, costPriceAtSale: 60, quantity: 2 });
    expect(r.revenue).toBe(200);
    expect(r.cogs).toBe(120);
    expect(r.profit).toBe(80);
    expect(r.marginPercent).toBe(40);
    expect(r.hasCost).toBe(true);
  });

  it("returns null cogs/profit/margin when cost unknown", () => {
    const r = calcItemProfit({ unitPrice: 100, costPriceAtSale: null, quantity: 1 });
    expect(r.revenue).toBe(100);
    expect(r.cogs).toBeNull();
    expect(r.profit).toBeNull();
    expect(r.marginPercent).toBeNull();
    expect(r.hasCost).toBe(false);
  });

  it("handles zero revenue (unitPrice 0) → margin null", () => {
    const r = calcItemProfit({ unitPrice: 0, costPriceAtSale: 10, quantity: 5 });
    expect(r.revenue).toBe(0);
    expect(r.cogs).toBe(50);
    expect(r.profit).toBe(-50);
    expect(r.marginPercent).toBeNull();
  });

  it("handles zero cost (margin 100%)", () => {
    const r = calcItemProfit({ unitPrice: 50, costPriceAtSale: 0, quantity: 1 });
    expect(r.profit).toBe(50);
    expect(r.marginPercent).toBe(100);
  });
});

describe("calcOrderProfit — ans2: unknown excluded from margin", () => {
  it("all known → margin computed", () => {
    const r = calcOrderProfit({
      items: [
        { unitPrice: 100, costPriceAtSale: 60, quantity: 2 },
        { unitPrice: 50, costPriceAtSale: 20, quantity: 1 },
      ],
      shippingPrice: 10,
    });
    expect(r.revenue).toBe(250);
    expect(r.cogs).toBe(140);
    expect(r.profit).toBe(110);
    expect(r.marginPercent).toBeCloseTo(44, 1);
    expect(r.unknownCostItems).toBe(0);
    expect(r.knownCostItems).toBe(2);
    expect(r.shippingPrice).toBe(10);
    expect(r.totalRevenueWithShipping).toBe(260);
  });

  it("mixed known+unknown → profit = revenue - knownCogs, but margin = null (ans2)", () => {
    const r = calcOrderProfit({
      items: [
        { unitPrice: 100, costPriceAtSale: 60, quantity: 1 }, // known
        { unitPrice: 200, costPriceAtSale: null, quantity: 1 }, // unknown → 200 should NOT count as 100% margin
      ],
    });
    expect(r.revenue).toBe(300);
    expect(r.cogs).toBe(60);
    expect(r.profit).toBe(240); // inflated if you trust it
    expect(r.unknownCostItems).toBe(1);
    expect(r.knownCostItems).toBe(1);
    // ans2: any unknown → margin null to signal untrustworthy
    expect(r.marginPercent).toBeNull();
  });

  it("all unknown → cogs 0, margin null", () => {
    const r = calcOrderProfit({
      items: [{ unitPrice: 100, costPriceAtSale: null, quantity: 2 }],
    });
    expect(r.revenue).toBe(200);
    expect(r.cogs).toBe(0);
    expect(r.profit).toBe(200);
    expect(r.marginPercent).toBeNull();
    expect(r.unknownCostItems).toBe(1);
    expect(r.knownCostItems).toBe(0);
  });

  it("empty items → zeros, margin null", () => {
    const r = calcOrderProfit({ items: [] });
    expect(r.revenue).toBe(0);
    expect(r.cogs).toBe(0);
    expect(r.profit).toBe(0);
    expect(r.marginPercent).toBeNull();
  });

  it("shipping excluded from profit/margin, tracked separately", () => {
    const r = calcOrderProfit({
      items: [{ unitPrice: 100, costPriceAtSale: 60, quantity: 1 }],
      shippingPrice: 30,
    });
    expect(r.profit).toBe(40);
    expect(r.marginPercent).toBe(40);
    expect(r.shippingPrice).toBe(30);
    expect(r.totalRevenueWithShipping).toBe(130);
  });
});

describe("calcMarginPercent", () => {
  it("computes (profit/revenue)*100", () => {
    expect(calcMarginPercent(40, 100)).toBe(40);
  });
  it("returns null when revenue 0", () => {
    expect(calcMarginPercent(10, 0)).toBeNull();
  });
});

describe("calcShippingTotal", () => {
  it("sums shippingPrice, defaults 0", () => {
    expect(calcShippingTotal([{ shippingPrice: 10 }, { shippingPrice: 20 }])).toBe(30);
    expect(calcShippingTotal([])).toBe(0);
  });
});
