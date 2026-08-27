import React from "react";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, Truck, Check, XCircle, Banknote } from "lucide-react";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  switch (status) {
    case "PENDING":
      return (
        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 font-medium">
          <Clock className="h-3 w-3" /> Pending
        </Badge>
      );
    case "CONFIRMED":
      return (
        <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 gap-1 font-medium">
          <Check className="h-3 w-3" /> Confirmed
        </Badge>
      );
    case "SHIPPED":
      return (
        <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 gap-1 font-medium">
          <Truck className="h-3 w-3" /> Shipped
        </Badge>
      );
    case "DELIVERED":
      return (
        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 font-medium">
          <CheckCircle2 className="h-3 w-3" /> Delivered
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 gap-1 font-medium">
          <XCircle className="h-3 w-3" /> Cancelled
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function PaymentStatusBadge({
  status,
  method,
}: {
  status: PaymentStatus;
  method?: string;
}) {
  if (status === "PAID") {
    return (
      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 font-medium">
        <CheckCircle2 className="h-3 w-3" /> Paid
      </Badge>
    );
  }

  if (status === "REFUNDED") {
    return (
      <Badge variant="outline" className="border-muted bg-muted text-muted-foreground gap-1 font-medium">
        Refunded
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300 gap-1 font-medium">
      <Banknote className="h-3 w-3" /> {method === "COD" ? "COD (Unpaid)" : "Unpaid"}
    </Badge>
  );
}
