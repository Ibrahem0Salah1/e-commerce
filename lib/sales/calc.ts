// lib/sales/calc.ts
// Pure functions for sales/profit calculations — no DB access, fully unit testable.

export type ItemProfitInput = {
  unitPrice: number;
  costPriceAtSale: number | null;
  quantity: number;
};

export type ItemProfit = {
  revenue: number;
  cogs: number | null; // null when cost unknown
  profit: number | null; // null when cost unknown
  marginPercent: number | null;
  hasCost: boolean;
};

export function calcItemProfit(item: ItemProfitInput): ItemProfit {
  const revenue = item.unitPrice * item.quantity;
  if (item.costPriceAtSale === null || item.costPriceAtSale === undefined) {
    return {
      revenue,
      cogs: null,
      profit: null,
      marginPercent: null,
      hasCost: false,
    };
  }
  const cogs = item.costPriceAtSale * item.quantity;
  const profit = revenue - cogs;
  const marginPercent = revenue > 0 ? (profit / revenue) * 100 : null;
  return { revenue, cogs, profit, marginPercent, hasCost: true };
}

export type OrderProfitInput = {
  items: ItemProfitInput[];
  shippingPrice?: number;
};

export type OrderProfit = {
  revenue: number; // product revenue only (subtotal)
  cogs: number; // sum of known cogs only
  profit: number; // revenue - cogs for known-cost items only
  marginPercent: number | null;
  unknownCostItems: number;
  knownCostItems: number;
  shippingPrice: number;
  // totals inclusive of shipping for convenience
  totalRevenueWithShipping: number;
};

export function calcOrderProfit(input: OrderProfitInput): OrderProfit {
  let revenue = 0;
  let cogs = 0;
  let unknownCostItems = 0;
  let knownCostItems = 0;

  for (const item of input.items) {
    const r = calcItemProfit(item);
    revenue += r.revenue;
    if (r.hasCost && r.cogs !== null && r.profit !== null) {
      cogs += r.cogs;
      knownCostItems += 1;
    } else {
      unknownCostItems += 1;
    }
  }

  const profit = revenue - cogs;
  // Business rule per user ans2: unknown-cost items are EXCLUDED from margin.
  // If any item lacks costPriceAtSale, margin is not trustworthy → null, caller shows warning.
  // Profit is still revenue - known cogs (conservative), but margin requires full cost basis.
  const rawMargin = revenue > 0 && knownCostItems > 0 ? (profit / revenue) * 100 : null;
  const marginPercent = unknownCostItems > 0 || knownCostItems === 0 ? null : rawMargin;
  const shippingPrice = input.shippingPrice ?? 0;

  return {
    revenue,
    cogs,
    profit,
    marginPercent,
    unknownCostItems,
    knownCostItems,
    shippingPrice,
    totalRevenueWithShipping: revenue + shippingPrice,
  };
}

/**
 * Totally separate shipping calc — kept distinct per business rule:
 * product profit excludes shipping; shipping is reported as its own line.
 */
export function calcShippingTotal(orders: { shippingPrice: number }[]): number {
  return orders.reduce((sum, o) => sum + (o.shippingPrice ?? 0), 0);
}

export function calcMarginPercent(profit: number, revenue: number): number | null {
  if (revenue === 0) return null;
  return (profit / revenue) * 100;
}
