import { requireAdmin } from "@/lib/auth/authz";
import {
  getSalesSummary,
  getSalesTimeSeries,
  getProductProfitability,
  getEarliestSaleDate,
} from "@/lib/sales/queries";
import { formatNumber } from "@/lib/utils/format";
import { SalesTimeSeriesChart } from "@/components/admin/sales/SalesTimeSeriesChart";
import { SalesProductChart } from "@/components/admin/sales/SalesProductChart";
import { fromZonedTime } from "date-fns-tz";

type SearchParams = {
  from?: string;
  to?: string;
  granularity?: string;
  deliveredOnly?: string;
};

function parseDateParam(v: string | undefined, endOfDay: boolean): Date | undefined {
  if (!v) return undefined;
  // <input type=date> gives Cairo calendar date (YYYY-MM-DD). Must interpret as
  // start/end of that day in Africa/Cairo, not UTC midnight, to avoid losing last day.
  // Uses date-fns-tz fromZonedTime for DST-safe conversion (Egypt DST reintroduced 2023).
  try {
    const time = endOfDay ? "23:59:59.999" : "00:00:00.000";
    const d: Date = fromZonedTime(`${v}T${time}`, "Africa/Cairo");
    return isNaN(d.getTime()) ? undefined : d;
  } catch {
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d;
  }
}

function getDefaultRange(earliest: Date | null): { from: Date; to: Date } {
  const to = new Date();
  if (earliest) {
    return { from: earliest, to };
  }
  const from = new Date();
  from.setDate(to.getDate() - 30);
  return { from, to };
}

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const granularity =
    params.granularity === "week" || params.granularity === "month" ? params.granularity : "day";
  const deliveredOnly = params.deliveredOnly === "true";

  const earliest = await getEarliestSaleDate();
  const defaults = getDefaultRange(earliest);

  const from = parseDateParam(params.from, false) ?? defaults.from;
  const to = parseDateParam(params.to, true) ?? defaults.to;

  // Ensure from <= to
  const rangeFrom = from > to ? to : from;
  const rangeTo = from > to ? from : to;

  const [summary, timeSeries, topProducts] = await Promise.all([
    getSalesSummary({ from: rangeFrom, to: rangeTo, deliveredOnly }),
    getSalesTimeSeries({ from: rangeFrom, to: rangeTo, granularity, deliveredOnly }),
    getProductProfitability({ from: rangeFrom, to: rangeTo, deliveredOnly, limit: 10, sortBy: "profit" }),
  ]);

  const hasUnknown = summary.unknownCostItems > 0;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sales & Profit</h1>
        <p className="text-sm text-muted-foreground">
          Revenue and gross profit from <strong>PAID</strong> and not cancelled orders. Profit = (selling price − cost at sale) × qty, product only. Shipping shown separately.
          {deliveredOnly ? " (Delivered only)" : ""}
        </p>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3 rounded-xl border bg-card p-4 text-sm">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">From</label>
          <input
            type="date"
            name="from"
            defaultValue={rangeFrom.toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" })}
            className="rounded-md border px-2 py-1.5"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">To</label>
          <input
            type="date"
            name="to"
            defaultValue={rangeTo.toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" })}
            className="rounded-md border px-2 py-1.5"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Granularity</label>
          <select name="granularity" defaultValue={granularity} className="rounded-md border px-2 py-1.5">
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>
        <label className="flex items-center gap-2 pt-5">
          <input type="checkbox" name="deliveredOnly" value="true" defaultChecked={deliveredOnly} />
          <span className="text-xs">Delivered only (stricter)</span>
        </label>
        <div className="flex items-end">
          <button type="submit" className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground">
            Apply
          </button>
        </div>
        {earliest && (
          <p className="w-full text-xs text-muted-foreground">
            Earliest salable order with cost: {earliest.toLocaleDateString()} (Africa/Cairo). Default range starts there to avoid pre-cost noise.
          </p>
        )}
      </form>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground">Revenue (products)</div>
          <div className="mt-1 text-2xl font-semibold">{formatNumber(summary.revenue)} EGP</div>
          <div className="text-xs text-muted-foreground">{summary.orderCount} paid orders • {summary.totalUnits} units</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground">COGS</div>
          <div className="mt-1 text-2xl font-semibold">{formatNumber(summary.cogs)} EGP</div>
          <div className="text-xs text-muted-foreground">Cost of goods sold (known costs only)</div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground">Gross Profit</div>
          <div className="mt-1 text-2xl font-semibold text-emerald-600">{formatNumber(summary.profit)} EGP</div>
          <div className="text-xs text-muted-foreground">
            Margin {summary.marginPercent !== null ? `${summary.marginPercent.toFixed(1)}%` : "—"}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground">Shipping Collected</div>
          <div className="mt-1 text-2xl font-semibold">{formatNumber(summary.shippingTotal)} EGP</div>
          <div className="text-xs text-muted-foreground">Total with shipping {formatNumber(summary.totalRevenueWithShipping)} EGP</div>
        </div>
      </div>

      {hasUnknown && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-200">
          {summary.unknownCostItems} item(s) in {summary.unknownCostOrders} order(s) have no costPriceAtSale (pre-migration stock). They are excluded from COGS/margin. Create restock invoices for historical products to fix if needed.
        </div>
      )}

      {/* Charts */}
      <SalesTimeSeriesChart data={timeSeries} granularity={granularity} />
      {/* Time series table (kept for export/debug) */}
      <div className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Revenue & Profit over time — details ({granularity}, Africa/Cairo)</h2>
        {timeSeries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No paid orders in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="px-2 py-2 text-left font-medium">Date (Cairo bucket)</th>
                  <th className="px-2 py-2 text-right font-medium">Revenue</th>
                  <th className="px-2 py-2 text-right font-medium">COGS</th>
                  <th className="px-2 py-2 text-right font-medium">Profit</th>
                  <th className="px-2 py-2 text-right font-medium">Margin</th>
                  <th className="px-2 py-2 text-right font-medium">Orders</th>
                  <th className="px-2 py-2 text-right font-medium">Shipping</th>
                </tr>
              </thead>
              <tbody>
                {timeSeries.map((p) => {
                  const start = new Date(p.bucket);
                  let label = start.toLocaleDateString("en-CA", { timeZone: "UTC" });
                  if (granularity === "week") {
                    const end = new Date(start);
                    end.setUTCDate(start.getUTCDate() + 6);
                    label = `${start.toLocaleDateString("en-CA", { timeZone: "UTC" })} → ${end.toLocaleDateString("en-CA", { timeZone: "UTC" })}`;
                  } else if (granularity === "month") {
                    label = start.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
                  }
                  return (
                    <tr key={p.bucket} className="border-b last:border-0">
                      <td className="px-2 py-1.5">{label} </td>
                    <td className="px-2 py-1.5 text-right">{formatNumber(p.revenue)}</td>
                    <td className="px-2 py-1.5 text-right">{formatNumber(p.cogs)}</td>
                    <td className="px-2 py-1.5 text-right text-emerald-600">{formatNumber(p.profit)}</td>
                    <td className="px-2 py-1.5 text-right">{p.marginPercent !== null ? `${p.marginPercent.toFixed(1)}%` : "—"}</td>
                    <td className="px-2 py-1.5 text-right">{p.orderCount}</td>
                    <td className="px-2 py-1.5 text-right">{formatNumber(p.shippingTotal)}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SalesProductChart data={topProducts} />

      {/* Top products table */}
      <div className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Top products by profit — details</h2>
        {topProducts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No product sales in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="px-2 py-2 text-left font-medium">Product</th>
                  <th className="px-2 py-2 text-right font-medium">Qty</th>
                  <th className="px-2 py-2 text-right font-medium">Revenue</th>
                  <th className="px-2 py-2 text-right font-medium">COGS</th>
                  <th className="px-2 py-2 text-right font-medium">Profit</th>
                  <th className="px-2 py-2 text-right font-medium">Margin</th>
                  <th className="px-2 py-2 text-right font-medium">Orders</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((r) => (
                  <tr key={r.productId} className="border-b last:border-0">
                    <td className="px-2 py-1.5">
                      {r.productSlug ? (
                        <a href={`/admin/product/${r.productSlug}`} className="text-primary hover:underline">
                          {r.productName}
                        </a>
                      ) : (
                        r.productName
                      )}
                      {r.unknownCostQty > 0 && <span className="ml-2 text-xs text-amber-600">({r.unknownCostQty} unknown cost)</span>}
                    </td>
                    <td className="px-2 py-1.5 text-right">{r.qtySold}</td>
                    <td className="px-2 py-1.5 text-right">{formatNumber(r.revenue)}</td>
                    <td className="px-2 py-1.5 text-right">{formatNumber(r.cogs)}</td>
                    <td className="px-2 py-1.5 text-right text-emerald-600">{formatNumber(r.profit)}</td>
                    <td className="px-2 py-1.5 text-right">{r.marginPercent !== null ? `${r.marginPercent.toFixed(1)}%` : "—"}</td>
                    <td className="px-2 py-1.5 text-right">{r.orderCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
