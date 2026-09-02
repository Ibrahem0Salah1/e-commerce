import "server-only";
import prisma from "@/lib/config/prisma";
import { Prisma } from "@prisma/client";
import { calcItemProfit, calcOrderProfit } from "./calc";
import { requireAdmin } from "@/lib/auth/authz";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export type SalesSummary = {
  revenue: number;
  cogs: number;
  profit: number;
  marginPercent: number | null;
  orderCount: number;
  totalUnits: number;
  shippingTotal: number;
  totalRevenueWithShipping: number;
  unknownCostItems: number;
  unknownCostOrders: number;
  from: string | null;
  to: string | null;
};

export type SalesTimePoint = {
  bucket: string; // ISO date string of bucket start in Cairo time (YYYY-MM-DD or week start etc)
  revenue: number;
  cogs: number;
  profit: number;
  marginPercent: number | null;
  orderCount: number;
  shippingTotal: number;
};

export type ProductProfitRow = {
  productId: string;
  productName: string;
  productSlug: string | null;
  qtySold: number;
  revenue: number;
  cogs: number;
  profit: number;
  marginPercent: number | null;
  unknownCostQty: number;
  orderCount: number;
};

export type OrderProfitDetail = {
  orderId: string;
  revenue: number;
  cogs: number;
  profit: number;
  marginPercent: number | null;
  shippingPrice: number;
  totalRevenueWithShipping: number;
  unknownCostItems: number;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    costPriceAtSale: number | null;
    revenue: number;
    cogs: number | null;
    profit: number | null;
    marginPercent: number | null;
  }[];
};

// ─────────────────────────────────────────
// Helpers — shared where clause
// ─────────────────────────────────────────

type SalesFilter = {
  from?: Date;
  to?: Date;
  deliveredOnly?: boolean;
};

function buildSalesWhere(filter: SalesFilter): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {
    paymentStatus: "PAID",
    status: { not: "CANCELLED" },
    paidAt: { not: null },
  };

  if (filter.deliveredOnly) {
    where.status = "DELIVERED";
    // keep paymentStatus PAID still
    where.paymentStatus = "PAID";
  }

  if (filter.from || filter.to) {
    const paidAt: Prisma.DateTimeFilter = {};
    if (filter.from) paidAt.gte = filter.from;
    if (filter.to) paidAt.lte = filter.to;
    where.paidAt = { ... (where.paidAt as object), ...paidAt };
  }

  return where;
}

// ─────────────────────────────────────────
// Summary
// ─────────────────────────────────────────

export async function getSalesSummary(filter: SalesFilter = {}): Promise<SalesSummary> {
  await requireAdmin();

  const conditions: Prisma.Sql[] = [
    Prisma.sql`"o"."paymentStatus" = 'PAID'`,
    Prisma.sql`"o"."paidAt" IS NOT NULL`,
    filter.deliveredOnly
      ? Prisma.sql`"o"."status" = 'DELIVERED'`
      : Prisma.sql`"o"."status" != 'CANCELLED'`,
  ];
  if (filter.from) conditions.push(Prisma.sql`"o"."paidAt" >= ${filter.from}`);
  if (filter.to) conditions.push(Prisma.sql`"o"."paidAt" <= ${filter.to}`);
  const whereSql = Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`;

  // Single source of truth for profit: revenue = unitPrice*qty (mirrors calcItemProfit), cogs = cost*qty when known
  type SummaryRow = {
    revenue: string | number;
    shipping: string | number;
    ordercount: string | number;
    totalunits: string | number;
    cogs: string | number;
    unknownitems: string | number;
    unknownorders: string | number;
  };
  // MVP: revenue = subtotal (discount not yet used). Future: COALESCE(SUM("o"."subtotal" - "o"."discountAmount"),0) when coupons enabled.
  const rows = await prisma.$queryRaw<SummaryRow[]>`
    SELECT
      COALESCE(SUM("o"."subtotal"), 0) AS revenue,
      COALESCE(SUM("o"."shippingPrice"), 0) AS shipping,
      COUNT(*)::int AS ordercount,
      COALESCE(SUM(agg."totalUnits"), 0)::int AS totalunits,
      COALESCE(SUM(agg."cogs"), 0) AS cogs,
      COALESCE(SUM(agg."unknownItems"), 0)::int AS unknownitems,
      COALESCE(SUM(CASE WHEN agg."unknownItems" > 0 THEN 1 ELSE 0 END), 0)::int AS unknownorders
    FROM "orders" "o"
    LEFT JOIN LATERAL (
      SELECT
        SUM("oi"."quantity")::int AS "totalUnits",
        SUM(CASE WHEN "oi"."costPriceAtSale" IS NOT NULL THEN "oi"."costPriceAtSale" * "oi"."quantity" ELSE 0 END) AS "cogs",
        COUNT(*) FILTER (WHERE "oi"."costPriceAtSale" IS NULL)::int AS "unknownItems"
      FROM "order_items" "oi"
      WHERE "oi"."orderId" = "o"."id"
    ) agg ON true
    ${whereSql}
  `;

  const r = rows[0];
  const revenue = Number(r?.revenue ?? 0);
  const cogs = Number(r?.cogs ?? 0);
  const shippingTotal = Number(r?.shipping ?? 0);
  const orderCount = Number(r?.ordercount ?? 0);
  const totalUnits = Number(r?.totalunits ?? 0);
  const unknownCostItems = Number(r?.unknownitems ?? 0);
  const unknownCostOrders = Number(r?.unknownorders ?? 0);
  const profit = revenue - cogs;
  // ans2: if any item lacks costPriceAtSale, margin is not trustworthy → null
  const rawMargin = revenue > 0 && orderCount > 0 ? (profit / revenue) * 100 : null;
  const marginPercent = orderCount === 0 || unknownCostItems > 0 ? null : rawMargin;

  return {
    revenue,
    cogs,
    profit,
    marginPercent,
    orderCount,
    totalUnits,
    shippingTotal,
    totalRevenueWithShipping: revenue + shippingTotal,
    unknownCostItems,
    unknownCostOrders,
    from: filter.from ? filter.from.toISOString() : null,
    to: filter.to ? filter.to.toISOString() : null,
  };
}

// ─────────────────────────────────────────
// Time series — requires raw SQL for date_trunc + Cairo timezone
// ─────────────────────────────────────────

export type Granularity = "day" | "week" | "month";

export async function getSalesTimeSeries(
  filter: SalesFilter & { granularity?: Granularity } = {},
): Promise<SalesTimePoint[]> {
  await requireAdmin();
  const granularity = filter.granularity ?? "day";

  // Declarative — single source for status + null-guard, no push/pop drift
  const conditions: Prisma.Sql[] = [
    Prisma.sql`"o"."paymentStatus" = 'PAID'`,
    Prisma.sql`"o"."paidAt" IS NOT NULL`,
    filter.deliveredOnly
      ? Prisma.sql`"o"."status" = 'DELIVERED'`
      : Prisma.sql`"o"."status" != 'CANCELLED'`,
  ];

  if (filter.from) {
    conditions.push(Prisma.sql`"o"."paidAt" >= ${filter.from}`);
  }
  if (filter.to) {
    conditions.push(Prisma.sql`"o"."paidAt" <= ${filter.to}`);
  }

  const whereSql = conditions.length
    ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
    : Prisma.empty;

  // date_trunc bucket in Africa/Cairo
  // For week, Postgres truncates to Monday 00:00 in that timezone.
  const truncArg = granularity === "day" ? "day" : granularity === "week" ? "week" : "month";

  type RawRow = {
    bucket: Date;
    revenue: string | number;
    shipping: string | number;
    cogs: string | number;
    ordercount: string | number;
    unknownitems: string | number;
  };

  const rows = await prisma.$queryRaw<RawRow[]>`
    SELECT
      date_trunc(${truncArg}, "o"."paidAt" AT TIME ZONE 'Africa/Cairo') AS bucket,
      COALESCE(SUM("o"."subtotal"), 0) AS revenue,
      COALESCE(SUM("o"."shippingPrice"), 0) AS shipping,
      COALESCE(SUM(oi.cogs), 0) AS cogs,
      COUNT(DISTINCT "o"."id")::int AS ordercount,
      COALESCE(SUM(oi.unknownItems), 0)::int AS unknownitems
    FROM "orders" "o"
    LEFT JOIN LATERAL (
      SELECT
        SUM("oi"."costPriceAtSale" * "oi"."quantity") AS cogs,
        COUNT(*) FILTER (WHERE "oi"."costPriceAtSale" IS NULL)::int AS unknownItems
      FROM "order_items" "oi"
      WHERE "oi"."orderId" = "o"."id"
    ) oi ON true
    ${whereSql}
    GROUP BY bucket
    ORDER BY bucket ASC
  `;

  return rows.map((r) => {
    const revenue = Number(r.revenue);
    const cogs = Number(r.cogs);
    const profit = revenue - cogs;
    const unknown = Number(r.unknownitems);
    // ans2: exclude unknown from margin — if bucket has any unknown cost, margin null
    const rawMargin = revenue > 0 ? (profit / revenue) * 100 : null;
    return {
      bucket: (r.bucket as Date).toISOString(),
      revenue,
      cogs,
      profit,
      marginPercent: unknown > 0 ? null : rawMargin,
      orderCount: Number(r.ordercount),
      shippingTotal: Number(r.shipping),
    };
  });
}

// ─────────────────────────────────────────
// Product profitability
// ─────────────────────────────────────────

export async function getProductProfitability(
  filter: SalesFilter & { limit?: number; sortBy?: "profit" | "revenue" | "qty" } = {},
): Promise<ProductProfitRow[]> {
  await requireAdmin();
  const limit = Math.min(100, Math.max(1, filter.limit ?? 20));
  const sortBy = filter.sortBy ?? "profit";

  const conditions: Prisma.Sql[] = [
    Prisma.sql`"o"."paymentStatus" = 'PAID'`,
    Prisma.sql`"o"."paidAt" IS NOT NULL`,
    filter.deliveredOnly
      ? Prisma.sql`"o"."status" = 'DELIVERED'`
      : Prisma.sql`"o"."status" != 'CANCELLED'`,
  ];
  if (filter.from) conditions.push(Prisma.sql`"o"."paidAt" >= ${filter.from}`);
  if (filter.to) conditions.push(Prisma.sql`"o"."paidAt" <= ${filter.to}`);
  const whereSql = Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`;

  // Order by is controlled via whitelist to avoid injection
  // profit is not a selected alias — compute as revenue - cogs
  const orderBySql =
    sortBy === "revenue"
      ? Prisma.sql`SUM("oi"."unitPrice" * "oi"."quantity") DESC`
      : sortBy === "qty"
        ? Prisma.sql`SUM("oi"."quantity") DESC`
        : Prisma.sql`SUM("oi"."unitPrice" * "oi"."quantity") - SUM(CASE WHEN "oi"."costPriceAtSale" IS NOT NULL THEN "oi"."costPriceAtSale" * "oi"."quantity" ELSE 0 END) DESC`;

  type RawProdRow = {
    productId: string;
    productName: string;
    productSlug: string | null;
    qtySold: string | number;
    revenue: string | number;
    cogs: string | number;
    unknownQty: string | number;
    orderCount: string | number;
  };

  // Aggregates mirror calcItemProfit: revenue = unitPrice*qty, cogs = cost*qty when not null
  const rows = await prisma.$queryRaw<RawProdRow[]>`
    SELECT
      "oi"."productId" AS "productId",
      MAX("oi"."productName") AS "productName",
      MAX("p"."slug") AS "productSlug",
      SUM("oi"."quantity")::int AS "qtySold",
      SUM("oi"."unitPrice" * "oi"."quantity") AS revenue,
      SUM(CASE WHEN "oi"."costPriceAtSale" IS NOT NULL THEN "oi"."costPriceAtSale" * "oi"."quantity" ELSE 0 END) AS cogs,
      SUM(CASE WHEN "oi"."costPriceAtSale" IS NULL THEN "oi"."quantity" ELSE 0 END)::int AS "unknownQty",
      COUNT(DISTINCT "o"."id")::int AS "orderCount"
    FROM "orders" "o"
    JOIN "order_items" "oi" ON "oi"."orderId" = "o"."id"
    LEFT JOIN "products" "p" ON "p"."id" = "oi"."productId"
    ${whereSql}
    GROUP BY "oi"."productId"
    ORDER BY ${orderBySql}
    LIMIT ${limit}
  `;

  return rows.map((r) => {
    const revenue = Number(r.revenue);
    const cogs = Number(r.cogs);
    const profit = revenue - cogs;
    const unknownQty = Number(r.unknownQty);
    const rawMargin = revenue > 0 ? (profit / revenue) * 100 : null;
    return {
      productId: r.productId,
      productName: r.productName,
      productSlug: r.productSlug,
      qtySold: Number(r.qtySold),
      revenue,
      cogs,
      profit,
      marginPercent: unknownQty > 0 ? null : rawMargin,
      unknownCostQty: unknownQty,
      orderCount: Number(r.orderCount),
    };
  });
}

// ─────────────────────────────────────────
// Single order profit
// ─────────────────────────────────────────

export async function getOrderProfit(orderId: string): Promise<OrderProfitDetail | null> {
  await requireAdmin();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      subtotal: true,
      shippingPrice: true,
      paymentStatus: true,
      status: true,
      items: {
        select: {
          productId: true,
          productName: true,
          unitPrice: true,
          costPriceAtSale: true,
          quantity: true,
        },
      },
    },
  });

  if (!order) return null;

  const items = order.items.map((i) => {
    const calc = calcItemProfit({
      unitPrice: Number(i.unitPrice),
      costPriceAtSale: i.costPriceAtSale !== null ? Number(i.costPriceAtSale) : null,
      quantity: i.quantity,
    });
    return {
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      costPriceAtSale: i.costPriceAtSale !== null ? Number(i.costPriceAtSale) : null,
      revenue: calc.revenue,
      cogs: calc.cogs,
      profit: calc.profit,
      marginPercent: calc.marginPercent,
    };
  });

  const orderCalc = calcOrderProfit({
    shippingPrice: Number(order.shippingPrice),
    items: order.items.map((i) => ({
      unitPrice: Number(i.unitPrice),
      costPriceAtSale: i.costPriceAtSale !== null ? Number(i.costPriceAtSale) : null,
      quantity: i.quantity,
    })),
  });

  return {
    orderId: order.id,
    revenue: orderCalc.revenue,
    cogs: orderCalc.cogs,
    profit: orderCalc.profit,
    marginPercent: orderCalc.marginPercent,
    shippingPrice: orderCalc.shippingPrice,
    totalRevenueWithShipping: orderCalc.totalRevenueWithShipping,
    unknownCostItems: orderCalc.unknownCostItems,
    items,
  };
}

// ─────────────────────────────────────────
// Earliest salable order date (for dashboard default range)
// ─────────────────────────────────────────

export async function getEarliestSaleDate(): Promise<Date | null> {
  await requireAdmin();
  const row = await prisma.order.findFirst({
    where: {
      paymentStatus: "PAID",
      status: { not: "CANCELLED" },
      paidAt: { not: null },
      items: { some: { costPriceAtSale: { not: null } } },
    },
    orderBy: { paidAt: "asc" },
    select: { paidAt: true },
  });
  return row?.paidAt ?? null;
}
