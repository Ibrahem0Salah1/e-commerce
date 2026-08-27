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
      className="py-4 md:py-5 border-b border-zinc-100 last:border-0"
    >
      {/* ── Mobile: compact sheet-style (flex) ── */}
      <div className="flex gap-3 md:hidden">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-muted">
          <Image
            src={item.image || "/placeholder-product.png"}
            alt={item.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <Link
            href={`/shop/${item.slug}`}
            className="text-xs font-medium leading-tight text-foreground hover:text-primary line-clamp-2"
          >
            {item.name}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
            {formatNumber(item.price)} EGP
            <span className="mx-1">·</span>
            <span className="font-medium text-foreground">{formatNumber(lineTotal)} EGP</span>
          </p>

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center border border-zinc-200 rounded-sm h-7 bg-white">
              <button
                type="button"
                aria-label="Decrease quantity"
                className="flex h-full w-7 items-center justify-center text-muted-foreground hover:bg-zinc-100 hover:text-foreground"
                onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="flex h-full w-8 items-center justify-center text-xs font-medium tabular-nums">
                {item.quantity}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                className="flex h-full w-7 items-center justify-center text-muted-foreground hover:bg-zinc-100 hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
                onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                disabled={item.quantity >= item.stock}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => onRemove(item.productId)}
              className="p-1 text-muted-foreground hover:text-destructive"
              aria-label="Remove item"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Desktop: 12-col grid ── */}
      <div className="hidden md:grid md:grid-cols-12 md:gap-4 items-center">
        <div className="col-span-6 flex items-start gap-4">
          <div className="relative w-20 h-20 lg:w-24 lg:h-24 shrink-0 overflow-hidden rounded-sm bg-muted">
            <Image
              src={item.image || "/placeholder-product.png"}
              alt={item.name}
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <Link
              href={`/shop/${item.slug}`}
              className="text-sm font-semibold leading-tight text-foreground hover:text-primary line-clamp-2"
            >
              {item.name}
            </Link>
            {(item as any).sku && (
              <span className="text-xs text-muted-foreground mt-1">SKU: {(item as any).sku}</span>
            )}
            {(item as any).variant && (
              <span className="text-xs text-muted-foreground">{(item as any).variant}</span>
            )}
            <button
              type="button"
              onClick={() => onRemove(item.productId)}
              className="mt-2 flex w-fit items-center gap-1 text-xs text-destructive/60 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
        </div>

        <div className="col-span-2 text-center">
          <span className="text-sm tabular-nums text-foreground">{formatNumber(item.price)} EGP</span>
        </div>

        <div className="col-span-2 flex justify-center">
          <div className="flex items-center border border-zinc-200 rounded-sm h-8 bg-white">
            <button
              type="button"
              aria-label="Decrease quantity"
              className="w-8 h-full flex items-center justify-center text-muted-foreground hover:bg-zinc-100 hover:text-foreground rounded-l-sm"
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
              className="w-12 h-full text-center border-none focus:ring-0 text-sm bg-transparent tabular-nums p-0"
            />
            <button
              type="button"
              aria-label="Increase quantity"
              className="w-8 h-full flex items-center justify-center text-muted-foreground hover:bg-zinc-100 hover:text-foreground rounded-r-sm disabled:opacity-40"
              onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
              disabled={item.quantity >= item.stock}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="col-span-2 text-right">
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {formatNumber(lineTotal)} EGP
          </span>
        </div>
      </div>
    </div>
  );
}