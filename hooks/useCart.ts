"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CartItem } from "@/lib/types";
import { useGuestCart } from "@/lib/cart/store";
import { authClient } from "@/lib/auth/client";
import { useEffect, useRef } from "react";
import {
  addToCartAction,
  getCartAction,
  removeFromCartAction,
  updateCartQuantityAction,
} from "@/lib/cart/actions";

export function useCart() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const queryClient = useQueryClient();
  const isLoggedIn = !!session;
  const hasMerged = useRef(false);
  const guestCart = useGuestCart();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["cart"] });

  const mergeMutation = useMutation({
    mutationFn: (items: CartItem[]) =>
      Promise.allSettled(
        items.map((item) => addToCartAction(item.variantId, item.quantity)),
      ),
    onSuccess: () => {
      guestCart.clearCart();
      invalidate();
      toast.success("Cart synced", {
        description: "Your guest cart items have been added.",
      });
    },
    onError: () => {
      hasMerged.current = false;
      toast.error("Sync failed", {
        description: "Could not merge your guest cart.",
      });
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
    queryFn: getCartAction,
    enabled: isLoggedIn,
    staleTime: 30_000,
  });

  const addMutation = useMutation({
    mutationFn: async ({
      variantId,
      quantity,
    }: {
      variantId: string;
      quantity: number;
    }) => {
      const result = await addToCartAction(variantId, quantity);
      if (!result.success) throw new Error(result.toast.title);
      return result;
    },
    onSuccess: (result) => {
      invalidate();
      toast.success(result.toast.title, {
        description: result.toast.description,
      });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not add item");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      variantId,
      quantity,
    }: {
      variantId: string;
      quantity: number;
    }) => {
      const result = await updateCartQuantityAction(variantId, quantity);
      if (!result.success) throw new Error(result.toast.title);
      return result;
    },
    onSuccess: (result) => {
      invalidate();
      toast.success(result.toast.title, {
        description: result.toast.description,
      });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not update item");
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (variantId: string) => {
      const result = await removeFromCartAction(variantId);
      if (!result.success) throw new Error(result.toast.title);
      return result;
    },
    onSuccess: (result) => {
      invalidate();
      toast.success(result.toast.title, {
        description: result.toast.description,
      });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not remove item");
    },
  });

  const items = isLoggedIn ? (query.data ?? []) : guestCart.items;

  const addItem = (item: Omit<CartItem, "quantity">, quantity = 1) => {
    if (isLoggedIn) {
      addMutation.mutate({ variantId: item.variantId, quantity });
    } else {
      guestCart.addItem(item, quantity);
      toast.success("Added to cart", {
        description: `${item.name} (${item.variantName}) has been added.`,
      });
    }
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (isLoggedIn) {
      updateMutation.mutate({ variantId, quantity });
    } else {
      if (quantity <= 0) {
        guestCart.removeItem(variantId);
        toast.success("Item removed");
      } else {
        guestCart.updateQuantity(variantId, quantity);
        toast.success("Quantity updated");
      }
    }
  };

  const removeItem = (variantId: string) => {
    if (isLoggedIn) {
      removeMutation.mutate(variantId);
    } else {
      guestCart.removeItem(variantId);
      toast.success("Item removed", {
        description: "Item has been removed from your cart.",
      });
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
