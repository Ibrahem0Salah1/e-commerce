"use client";

import { ShoppingBag, Clock, CheckCircle2, Truck, XCircle, Banknote } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AdminOrderMetrics } from "@/lib/orders/types";
import { formatNumber } from "@/lib/utils/format";
import { useOrderMetrics } from "@/hooks/useOrders";

type StatConfig = {
  key: keyof AdminOrderMetrics;
  label: string;
  icon: LucideIcon;
  iconClassName: string;
  isCurrency?: boolean;
};

const STATS: StatConfig[] = [
  {
    key: "total",
    label: "Total Orders",
    icon: ShoppingBag,
    iconClassName: "bg-primary/10 text-primary",
  },
  {
    key: "pending",
    label: "Pending",
    icon: Clock,
    iconClassName: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    key: "confirmed",
    label: "Confirmed",
    icon: CheckCircle2,
    iconClassName: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    key: "shipped",
    label: "Shipped",
    icon: Truck,
    iconClassName: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  {
    key: "delivered",
    label: "Delivered",
    icon: CheckCircle2,
    iconClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "cancelled",
    label: "Cancelled",
    icon: XCircle,
    iconClassName: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
];

/**
 * Metrics data-grid for the admin orders dashboard, fed by useOrderMetrics.
 * SSR initialData gives an instant first paint; mutations invalidate the
 * ["admin-order-metrics"] query to refresh the numbers.
 */
export function OrdersStatsGrid({ initialData }: { initialData?: AdminOrderMetrics }) {
  const { data } = useOrderMetrics(initialData);
  const metrics: AdminOrderMetrics = data ?? {
    total: 0,
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-7">
      {STATS.map((stat) => (
        <StatCard key={stat.key} stat={stat} metrics={metrics} />
      ))}

      {/* Revenue highlight card */}
      <StatCard
        stat={{
          key: "totalRevenue",
          label: "Revenue (Paid)",
          icon: Banknote,
          iconClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          isCurrency: true,
        }}
        metrics={metrics}
        className="border-emerald-500/25 bg-gradient-to-br from-emerald-500/5 to-transparent"
      />
    </div>
  );
}

function StatCard({
  stat,
  metrics,
  className,
}: {
  stat: StatConfig;
  metrics: AdminOrderMetrics;
  className?: string;
}) {
  const Icon = stat.icon;

  return (
    <div
      className={`group rounded-xl border border-border bg-card p-4 transition-all hover:border-border/80 hover:shadow-sm ${className ?? ""}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {stat.label}
        </span>
        <div
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105 ${stat.iconClassName}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 truncate text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-2xl">
        {stat.isCurrency ? (
          <>
            {formatNumber(metrics[stat.key])}
            <span className="ml-1 text-xs font-medium text-muted-foreground">EGP</span>
          </>
        ) : (
          formatNumber(metrics[stat.key])
        )}
      </p>
    </div>
  );
}
