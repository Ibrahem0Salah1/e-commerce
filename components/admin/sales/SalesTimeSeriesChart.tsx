"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { SalesTimePoint, Granularity } from "@/lib/sales/queries";
import { formatNumber } from "@/lib/utils/format";

type Props = {
  data: SalesTimePoint[];
  granularity: Granularity;
};

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
  profit: {
    label: "Profit",
    color: "var(--chart-2)",
  },
  cogs: {
    label: "COGS",
    color: "var(--chart-3)",
  },
  shipping: {
    label: "Shipping",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

function formatBucket(iso: string, granularity: Granularity) {
  // Bucket from DB is Cairo wall time returned as naive timestamp (treated as UTC by JS).
  // Render as UTC to avoid re-applying Cairo offset twice.
  const d = new Date(iso);
  if (granularity === "month") {
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
  }
  if (granularity === "week") {
    const end = new Date(d);
    end.setUTCDate(d.getUTCDate() + 6);
    const startStr = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
    const endStr = end.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
    return `${startStr} – ${endStr}`;
  }
  // day: DD/MM
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
}

function formatTooltipLabel(iso: string, granularity: Granularity) {
  // Bucket is already Cairo wall time; format as UTC to avoid double offset
  const start = new Date(iso);
  if (granularity === "week") {
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    const s = start.toLocaleDateString("en-CA", { timeZone: "UTC" });
    const e = end.toLocaleDateString("en-CA", { timeZone: "UTC" });
    return `${s} → ${e}`;
  }
  if (granularity === "month") {
    return start.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  }
  return start.toLocaleDateString("en-CA", { timeZone: "UTC" });
}

export function SalesTimeSeriesChart({ data, granularity }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue & Profit over time</CardTitle>
          <CardDescription>No data for this period</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">No paid orders in this period.</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((p) => ({
    bucket: p.bucket,
    label: formatBucket(p.bucket, granularity),
    tooltipLabel: formatTooltipLabel(p.bucket, granularity),
    revenue: p.revenue,
    profit: p.profit,
    cogs: p.cogs,
    shipping: p.shippingTotal,
    orders: p.orderCount,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue & Profit over time</CardTitle>
        <CardDescription>
          {granularity === "day" ? "Daily" : granularity === "week" ? "Weekly" : "Monthly"} buckets — Africa/Cairo timezone • Product revenue only, shipping separate
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
          <BarChart data={chartData} margin={{ left: 12, right: 12, top: 8 }} barCategoryGap="20%" barGap={4}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => formatNumber(v as number)} />
            <ChartTooltip
              cursor={{ fill: "var(--muted)" }}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const first = payload?.[0]?.payload as { tooltipLabel?: string } | undefined;
                    return first?.tooltipLabel ?? "";
                  }}
                  formatter={(value, name) => {
                    const n = typeof name === "string" ? name : String(name);
                    return (
                      <>
                        <span className="text-muted-foreground capitalize">{n}</span>
                        <span className="font-mono font-medium tabular-nums">{formatNumber(Number(value))} EGP</span>
                      </>
                    );
                  }}
                />
              }
            />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} maxBarSize={48} />
            <Bar dataKey="cogs" fill="var(--color-cogs)" radius={[4, 4, 0, 0]} maxBarSize={48} />
            <Bar dataKey="profit" fill="var(--color-profit)" radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ChartContainer>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "var(--chart-1)" }} /> Revenue</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "var(--chart-3)" }} /> COGS</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "var(--chart-2)" }} /> Profit</span>
        </div>
      </CardContent>
    </Card>
  );
}
