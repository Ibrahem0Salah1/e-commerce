"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem } from "@/lib/types";
import { formatNumber } from "@/lib/utils/format";

type CartCardProps = {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
};

export function CartCard({ item, onUpdateQuantity, onRemove }: CartCardProps) {
  const lineTotal = item.price * item.quantity;

  return (
    <div
      data-testid={`cart-item-${item.slug}`}
      className="bg-card border border-border rounded-lg p-4 flex flex-col md:grid md:grid-cols-12 md:gap-4 items-start md:items-center hover:border-border/80 transition-colors duration-150"
    >
      {/* ── Product column ── */}
      <div className="col-span-6 flex items-start gap-4 w-full">
        <div className="relative w-24 h-24 shrink-0 overflow-hidden rounded-md bg-muted border border-border/40">
          <Image
            src={item.image || "/placeholder-product.png"}
            alt={item.name}
            fill
            className="object-cover"
            sizes="96px"
          />
        </div>
        <div className="flex flex-col grow min-w-0">
          <Link
            href={`/shop/${item.slug}`}
            className="text-sm font-semibold text-foreground leading-tight hover:text-primary transition-colors line-clamp-2"
          >
            {item.name}
          </Link>
          {/* SKU — add to CartItem type if you want it displayed */}
          {(item as any).sku && (
            <span className="text-xs text-muted-foreground mt-1">
              SKU: {(item as any).sku}
            </span>
          )}
          {/* Variant / attribute summary */}
          {(item as any).variant && (
            <span className="text-xs text-muted-foreground">
              {(item as any).variant}
            </span>
          )}
          <div className="flex gap-4 mt-2">
            <button
              type="button"
              onClick={() => onRemove(item.productId)}
              className="text-xs text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </div>
      </div>

      {/* ── Unit Price ── */}
      <div className="col-span-2 text-center w-full md:w-auto mt-4 md:mt-0 flex justify-between md:block items-center">
        <span className="md:hidden text-xs text-muted-foreground uppercase tracking-wider font-medium">Price</span>
        <span className="text-sm text-foreground tabular-nums">
          {formatNumber(item.price)} EGP
        </span>
      </div>

      {/* ── Quantity stepper ── */}
      <div className="col-span-2 flex justify-center w-full md:w-auto mt-3 md:mt-0">
        <div className="flex items-center border border-border rounded-md h-8">
          <button
            type="button"
            aria-label="Decrease quantity"
            className="w-8 h-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors rounded-l-md"
            onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <input
            type="number"
            min={1}
            value={item.quantity}
            readOnly
            data-testid="cart-item-quantity"
            className="w-12 h-full text-center border-none focus:ring-0 text-sm bg-transparent text-foreground tabular-nums p-0"
          />
          <button
            type="button"
            aria-label="Increase quantity"
            className="w-8 h-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors rounded-r-md disabled:opacity-40 disabled:pointer-events-none"
            onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
            disabled={item.quantity >= item.stock}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Subtotal ── */}
      <div className="col-span-2 text-right w-full md:w-auto mt-3 md:mt-0 flex justify-between md:block items-center">
        <span className="md:hidden text-xs text-muted-foreground uppercase tracking-wider font-medium">Subtotal</span>
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {formatNumber(lineTotal)} EGP
        </span>
      </div>
    </div>
  );
}