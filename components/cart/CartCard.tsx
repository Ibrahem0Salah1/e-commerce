"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CartItem } from "@/lib/types";

type CartCardProps = {
  item: CartItem;
  onUpdateQuantity: (variantId: string, quantity: number) => void;
  onRemove: (variantId: string) => void;
};

export function CartCard({ item, onUpdateQuantity, onRemove }: CartCardProps) {
  const lineTotal = item.price * item.quantity;

  return (
    <div className="flex gap-4 rounded-xl border border-border bg-card p-4">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-secondary/40 sm:size-24">
        <Image
          src={item.image || "/placeholder-product.png"}
          alt={item.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 80px, 96px"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/shop/${item.slug}`}
              className="line-clamp-1 text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              {item.name}
            </Link>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {item.variantName}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {item.price.toLocaleString()} EGP / item
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon-xs"
            className="shrink-0 cursor-pointer text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(item.variantId)}
            aria-label={`Remove ${item.name}`}
          >
            <Trash2 />
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-xs"
              className="cursor-pointer"
              onClick={() => onUpdateQuantity(item.variantId, item.quantity - 1)}
              aria-label="Decrease quantity"
            >
              <Minus />
            </Button>
            <span className="flex h-7 w-10 items-center justify-center text-sm tabular-nums">
              {item.quantity}
            </span>
            <Button
              variant="outline"
              size="icon-xs"
              className="cursor-pointer"
              onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)}
              aria-label="Increase quantity"
            >
              <Plus />
            </Button>
          </div>

          <span className="text-sm font-semibold tabular-nums">
            {lineTotal.toLocaleString()}
            <span className="ml-0.5 text-xs font-normal text-muted-foreground">
              EGP
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
