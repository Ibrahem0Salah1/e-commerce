"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { ProductProfitRow } from "@/lib/sales/queries";
import { formatNumber } from "@/lib/utils/format";

type Props = {
  data: ProductProfitRow[];
};

const chartConfig = {
  profit: {
    label: "Profit",
    color: "var(--chart-2)",
  },
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function SalesProductChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top products by profit</CardTitle>
          <CardDescription>No product sales in this period</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="py-6 text-center text-sm text-muted-foreground">No data</p>
        </CardContent>
      </Card>
    );
  }

  // Show up to 8 for readability; truncate long names
  const chartData = data.slice(0, 8).map((r) => ({
    name: r.productName.length > 18 ? r.productName.slice(0, 18) + "…" : r.productName,
    fullName: r.productName,
    profit: r.profit,
    revenue: r.revenue,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top products by profit</CardTitle>
        <CardDescription>Product-only profit (shipping excluded)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[360px] w-full">
          <BarChart data={chartData} layout="vertical" margin={{ left: 12, right: 16 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => formatNumber(v as number)} />
            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={110} tick={{ fontSize: 12 }} />
            <ChartTooltip
              cursor={{ fill: "var(--muted)" }}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => (payload?.[0]?.payload as { fullName?: string })?.fullName ?? ""}
                  formatter={(value, name) => (
                    <>
                      <span className="text-muted-foreground capitalize">{String(name)}</span>
                      <span className="font-mono font-medium">{formatNumber(Number(value))} EGP</span>
                    </>
                  )}
                />
              }
            />
            <Bar dataKey="profit" fill="var(--color-profit)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
