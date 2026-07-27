"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect, useCallback } from "react";
import type { CartItem } from "@/lib/types";
import { useGuestCart } from "@/lib/cart/store";
import { authClient } from "@/lib/auth/client";
import {
  addToCartAction,
  getCartAction,
  removeFromCartAction,
  updateCartQuantityAction,
  clearCartAction,
} from "@/lib/cart/actions";

/* ── Module-level guard: ensures merge runs once per user, globally ── */
let lastMergedUserId: string | null = null;

export function useCart() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const queryClient = useQueryClient();
  const isLoggedIn = !!session;
  const guestCart = useGuestCart();

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
    [queryClient],
  );

  /* ── Merge guest cart on login ── */
  const mergeMutation = useMutation({
    mutationFn: async (items: CartItem[]) => {
      const results = await Promise.allSettled(
        items.map((item) => addToCartAction(item.productId, item.quantity)),
      );

      const succeeded: string[] = [];
      const failed: string[] = [];

      results.forEach((res, idx) => {
        if (res.status === "fulfilled" && res.value.success) {
          succeeded.push(items[idx].productId);
        } else {
          failed.push(items[idx].productId);
        }
      });

      return { succeeded, failed };
    },
    onSuccess: ({ succeeded, failed }) => {
      if (succeeded.length > 0) {
        // Functional update: remove only the items we just merged,
        // preserving anything the user added to guest cart while merge was in flight
        useGuestCart.setState((state) => ({
          items: state.items.filter((i) => !succeeded.includes(i.productId)),
        }));
      }

      if (failed.length === 0) {
        toast.success("Cart synced", {
          description: "Your guest cart items have been added.",
        });
      } else if (succeeded.length > 0) {
        toast.success("Partially synced", {
          description: `${succeeded.length} item(s) added. ${failed.length} failed (stock or availability).`,
        });
      } else {
        toast.error("Sync failed", {
          description:
            "None of your guest items could be added. They remain in your local cart.",
        });
      }

      invalidate();
    },
    onError: () => {
      // Allow retry on next mount / auth change
      lastMergedUserId = null;
      toast.error("Sync failed", {
        description: "Could not merge your guest cart. Items preserved locally.",
      });
    },
  });

  useEffect(() => {
    const userId = session?.user?.id;

    // Reset when logged out so next login can merge again
    if (!isLoggedIn) {
      lastMergedUserId = null;
      return;
    }

    if (
      userId &&
      lastMergedUserId !== userId &&
      !mergeMutation.isPending &&
      guestCart.items.length > 0
    ) {
      lastMergedUserId = userId;
      mergeMutation.mutate(guestCart.items);
    }
  }, [isLoggedIn, session?.user?.id, guestCart.items, mergeMutation]);

  /* ── Server cart query ── */
  const query = useQuery({
    queryKey: ["cart"],
    queryFn: getCartAction,
    enabled: isLoggedIn,
    staleTime: 30_000,
  });

  /* ── Mutations ── */
  const addMutation = useMutation({
    mutationFn: async ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => {
      const result = await addToCartAction(productId, quantity);
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
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => {
      const result = await updateCartQuantityAction(productId, quantity);
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
    mutationFn: async (productId: string) => {
      const result = await removeFromCartAction(productId);
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
      toast.error(
        err instanceof Error ? err.message : "Could not remove item",
      );
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const result = await clearCartAction();
      if (!result.success) throw new Error(result.toast.title);
      return result;
    },
    onSuccess: (result) => {
      invalidate();
      toast.success(result.toast.title);
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Could not clear cart",
      );
    },
  });

  /* ── Unified API ── */
  const items = isLoggedIn ? (query.data ?? []) : guestCart.items;

  const addItem = (item: Omit<CartItem, "quantity">, quantity = 1) => {
    if (isLoggedIn) {
      addMutation.mutate({ productId: item.productId, quantity });
    } else {
      guestCart.addItem(item, quantity);
      toast.success("Added to cart", {
        description: `${item.name} has been added.`,
      });
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (isLoggedIn) {
      updateMutation.mutate({ productId, quantity });
    } else {
      if (quantity <= 0) {
        guestCart.removeItem(productId);
        toast.success("Item removed");
      } else {
        guestCart.updateQuantity(productId, quantity);
        toast.success("Quantity updated");
      }
    }
  };

  const removeItem = (productId: string) => {
    if (isLoggedIn) {
      removeMutation.mutate(productId);
    } else {
      guestCart.removeItem(productId);
      toast.success("Item removed", {
        description: "Item has been removed from your cart.",
      });
    }
  };

  const clearCart = () => {
    if (isLoggedIn) {
      clearMutation.mutate();
    } else {
      guestCart.clearCart();
      toast.success("Cart cleared");
    }
  };

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce(
    (s, i) => s + Number(i.price) * i.quantity,
    0,
  );

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    isLoggedIn,
    isLoading: sessionLoading || (isLoggedIn && query.isLoading),
    isMerging: mergeMutation.isPending,
  };
}