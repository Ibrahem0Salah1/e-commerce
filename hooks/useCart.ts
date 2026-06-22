"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CartItem } from "@/lib/types";
import { useGuestCart } from "@/lib/cart-store";
import { authClient } from "@/lib/auth-client";
import { useEffect, useRef } from "react";
async function fetchCart(): Promise<CartItem[]> {
  const res = await fetch("/api/cart");
  if (!res.ok) throw new Error("Failed to fetch cart");
  const data = await res.json();
  return data.items;
}

function apiCall(method: string, body?: unknown) {
  return fetch("/api/cart", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function useCart() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const queryClient = useQueryClient();
  const isLoggedIn = !!session;
  const hasMerged = useRef(false);
  const guestCart = useGuestCart();

  //invalidate
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["cart"] });
  //merge Mutation
  const mergeMutation = useMutation({
    mutationFn: (items: CartItem[]) =>
      Promise.allSettled(
        items.map((item) =>
          apiCall("POST", {
            variantId: item.variantId,
            quantity: item.quantity,
          }),
        ),
      ),
    onSuccess: () => {
      guestCart.clearCart(); // wipe localStorage only after DB confirms
      invalidate();
    },
    onError: () => {
      hasMerged.current = false;
    },
  });
  useEffect(() => {
    if (isLoggedIn && !hasMerged.current && guestCart.items.length > 0) {
      hasMerged.current = true;
      mergeMutation.mutate(guestCart.items);
    }
  }, [isLoggedIn]);
  const query = useQuery({
    queryKey: ["cart"],
    queryFn: fetchCart,
    enabled: isLoggedIn,
    staleTime: 30_000,
  });
  const addMutation = useMutation({
    mutationFn: ({
      variantId,
      quantity,
    }: {
      variantId: string;
      quantity: number;
    }) => apiCall("POST", { variantId, quantity }),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      variantId,
      quantity,
    }: {
      variantId: string;
      quantity: number;
    }) => apiCall("PATCH", { variantId, quantity }),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (variantId: string) =>
      fetch(`/api/cart?variantId=${variantId}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });

  const items = isLoggedIn ? (query.data ?? []) : guestCart.items;

  const addItem = (item: Omit<CartItem, "quantity">, quantity = 1) => {
    if (isLoggedIn) {
      addMutation.mutate({ variantId: item.variantId, quantity });
    } else {
      guestCart.addItem(item, quantity);
    }
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (isLoggedIn) {
      updateMutation.mutate({ variantId, quantity });
    } else {
      guestCart.updateQuantity(variantId, quantity);
    }
  };

  const removeItem = (variantId: string) => {
    if (isLoggedIn) {
      removeMutation.mutate(variantId);
    } else {
      guestCart.removeItem(variantId);
    }
  };

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    totalItems,
    totalPrice,
    isLoggedIn,
    isLoading: sessionLoading || (isLoggedIn && query.isLoading),
  };
}
