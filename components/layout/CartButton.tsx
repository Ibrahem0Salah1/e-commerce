"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "@/hooks/useCart";

export function CartButton() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem } =
    useCart();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-secondary cursor-pointer"
        >
          <ShoppingCart className="h-6 w-6 text-foreground" />
          {totalItems > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
              {totalItems > 99 ? "99+" : totalItems}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col data-[side=right]:w-[85%] sm:data-[side=right]:w-3/4">
        <SheetHeader>
          <SheetTitle>
            Cart {totalItems > 0 && `(${totalItems})`}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          </div>
        ) : (
          <div className="flex-1 space-y-3 overflow-y-auto mx-1">
            {items.map((item) => (
              <div
                key={item.variantId}
                className="flex gap-3 rounded-lg border border-border p-3"
              >
                <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-secondary/40">
                  <Image
                    src={item.image || "/placeholder-product.png"}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link
                      href={`/shop/${item.slug}`}
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {item.variantName}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon-xs"
                        className="cursor-pointer"
                        onClick={() =>
                          updateQuantity(item.variantId, item.quantity - 1)
                        }
                      >
                        <Minus />
                      </Button>
                      <span className="w-8 text-center text-sm tabular-nums">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon-xs"
                        className="cursor-pointer"
                        onClick={() =>
                          updateQuantity(item.variantId, item.quantity + 1)
                        }
                      >
                        <Plus />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums">
                        {(item.price * item.quantity).toLocaleString()}
                        <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                          EGP
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="cursor-pointer text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.variantId)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <>
            <Separator />
            <SheetFooter className="mt-auto">
              <div className="flex w-full flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-medium text-foreground">
                    Total
                  </span>
                  <span className="text-lg font-bold tabular-nums">
                    {totalPrice.toLocaleString()}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      EGP
                    </span>
                  </span>
                </div>
                <SheetClose asChild>
                  <Button asChild variant="outline" size="sm" className="w-full cursor-pointer">
                    <Link href="/cart">Go to Cart</Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button asChild size="lg" className="w-full cursor-pointer">
                    <Link href="/checkout">Checkout</Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
