import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Phone,
  Truck,
  User,
  FileText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getAdminOrderDetail } from "@/lib/orders/queries";
import { formatNumber } from "@/lib/utils/format";
import { buildWhatsAppLink, buildOrderWhatsAppMessage } from "@/lib/utils/phone";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/admin/orders/OrderStatusBadge";
import { AdminOrderActions } from "@/components/admin/orders/AdminOrderActions";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getAdminOrderDetail(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Back navigation */}
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="-ml-2 cursor-pointer gap-2 text-muted-foreground hover:text-foreground"
      >
        <Link href="/admin/orders">
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-card p-6 shadow-xs">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Order reference
          </p>
          <h1 className="mt-1 font-mono text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            #{order.id.toUpperCase()}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" /> Placed {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} method={order.paymentMethod} />
        </div>
      </div>

      {/* Actions */}
      <AdminOrderActions order={order} />

      {/* Timeline */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 rounded-xl border border-border bg-muted/30 px-5 py-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" /> Placed:{" "}
          <span className="font-medium text-foreground">{formatDateTime(order.createdAt)}</span>
        </span>
        {order.paidAt && (
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Paid:{" "}
            <span className="font-medium">{formatDateTime(order.paidAt)}</span>
          </span>
        )}
        {order.cancelledAt && (
          <span className="flex items-center gap-1.5 text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" /> Cancelled:{" "}
            <span className="font-medium">{formatDateTime(order.cancelledAt)}</span>
          </span>
        )}
      </div>

      {/* Customer & destination */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InfoCard icon={User} title="Customer">
          <InfoRow label="Recipient" value={order.shippingName} />
          <InfoRow
            label="Phone"
            value={
              <a
                href={`tel:${order.shippingPhone}`}
                className="font-medium text-primary hover:underline"
              >
                {order.shippingPhone}
              </a>
            }
          />
          {order.user ? (
            <InfoRow
              label="Account"
              value={`${order.user.name} (${order.user.email})`}
            />
          ) : (
            <InfoRow label="Account" value="Guest checkout" />
          )}
        </InfoCard>

        <InfoCard icon={MapPin} title="Destination & delivery">
          <InfoRow label="City / Governorate" value={order.shippingCity} />
          <InfoRow label="Address" value={order.shippingAddress} />
          <InfoRow
            label="Method"
            value={
              <span className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                {order.shippingMethodName ?? "Standard"} —{" "}
                {formatNumber(order.shippingPrice)} EGP
              </span>
            }
          />
        </InfoCard>
      </div>

      {/* Delivery note */}
      {order.shippingNotes && (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Delivery notes
            </p>
            <p className="mt-1 italic text-foreground">&ldquo;{order.shippingNotes}&rdquo;</p>
          </div>
        </div>
      )}

      {/* Items & financials */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="border-b border-border bg-muted/40 px-5 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ordered products ({order.itemCount} units)
          </h3>
        </div>

        <div className="divide-y divide-border">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 p-5">
              <div className="flex min-w-0 items-center gap-4">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                  {item.product?.images?.[0] ? (
                    <Image
                      src={item.product.images[0]}
                      alt={item.productName}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.productName}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatNumber(item.unitPrice)} EGP × {item.quantity}
                  </p>
                  {item.costPriceAtSale != null && (
                    <p className="text-[11px] text-muted-foreground">
                      Cost at sale: {formatNumber(item.costPriceAtSale * item.quantity)} EGP
                    </p>
                  )}
                </div>
              </div>
              <p className="shrink-0 text-sm font-bold tabular-nums text-foreground">
                {formatNumber(item.totalPrice)} EGP
              </p>
            </div>
          ))}
        </div>

        {/* Financial breakdown */}
        <div className="space-y-2 border-t border-border bg-muted/20 p-5 text-sm">
          <FinancialRow label={`Subtotal (${order.itemCount} units)`} value={`${formatNumber(order.subtotal)} EGP`} />
          {order.discountAmount > 0 && (
            <FinancialRow
              label="Discount"
              value={`-${formatNumber(order.discountAmount)} EGP`}
              className="text-emerald-600 dark:text-emerald-400"
            />
          )}
          <FinancialRow label="Shipping" value={`${formatNumber(order.shippingPrice)} EGP`} />
          <Separator />
          <div className="flex items-baseline justify-between pt-1">
            <span className="font-bold text-foreground">Total (COD)</span>
            <span className="text-lg font-extrabold tabular-nums text-primary">
              {formatNumber(order.total)} EGP
            </span>
          </div>
        </div>
      </div>

      {/* Customer contact quick actions */}
      <div className="flex flex-wrap justify-end gap-2 pb-4">
        <Button asChild variant="outline" size="sm" className="gap-2 cursor-pointer">
          <a href={`tel:${order.shippingPhone}`}>
            <Phone className="h-3.5 w-3.5" /> Call customer
          </a>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="cursor-pointer gap-2 border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          <a
            href={buildWhatsAppLink(order.shippingPhone, buildOrderWhatsAppMessage(order))}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp customer
          </a>
        </Button>
      </div>
    </div>
  );
}

/* ── Small local presentational helpers ── */

/** Brand icon (lucide has none) — simple-icons WhatsApp glyph, fill-based. */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" /> {title}
      </h3>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="break-words text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function FinancialRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex justify-between ${className ?? "text-muted-foreground"}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
