"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
// import { useCart } from "@/lib/cart-context";

export function CartButton() {
    //   const { totalItems } = useCart();

    return (
        <Link href="/checkout">
            <Button variant="ghost" size="icon" className="relative hover:bg-secondary cursor-pointer">
                <ShoppingCart className="h-6 w-6 text-foreground" />
            </Button>
        </Link>
    );
}