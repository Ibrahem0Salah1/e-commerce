// hooks/useCart.ts
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
  mergeCartAction,
  removeFromCartAction,
  updateCartQuantityAction,
  clearCartAction,
} from "@/lib/cart/actions";

let lastMergedUserId: string | null = null;
let mergeAttemptedForUser: string | null = null;

export function useCart() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const queryClient = useQueryClient();
  const isLoggedIn = !!session;
  const guestCart = useGuestCart();

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
    [queryClient],
  );

  /* â”€â”€ Merge guest cart on login â”€â”€ */
  const mergeMutation = useMutation({
    mutationFn: async (items: CartItem[]) =>
      mergeCartAction(
        items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      ),
    onSuccess: (outcome) => {
      // Everything the server classified is resolved one way or another:
      // added → lives in the DB cart; skippedStockFull → DB cart already holds
      // the max; unavailable → gone from the catalog. Only `pending` items
      // stay local for a later retry.
      const processed = new Set<string>([
        ...outcome.added.map((a) => a.productId),
        ...outcome.skippedStockFull,
        ...outcome.unavailable,
      ]);

      if (processed.size > 0) {
        useGuestCart.setState((state) => ({
          items: state.items.filter((i) => !processed.has(i.productId)),
        }));
      }

      const totalAdded = outcome.added.reduce((sum, a) => sum + a.quantity, 0);
      const clampedCount = outcome.added.filter(
        (a) => a.quantity < a.requestedQuantity,
      ).length;

      if (totalAdded > 0) {
        toast.success(
          clampedCount > 0 ? "Cart synced (stock-limited)" : "Cart synced",
          {
            description:
              clampedCount > 0
                ? `${totalAdded} unit(s) merged — some quantities were limited by available stock.`
                : `${totalAdded} unit(s) merged into your account cart.`,
          },
        );
      }

      if (outcome.unavailable.length > 0) {
        toast.error(`${outcome.unavailable.length} item(s) removed`, {
          description:
            "No longer available in the catalog, so they were discarded.",
        });
      }

      if (outcome.skippedStockFull.length > 0) {
        toast.warning("Already at stock limit", {
          description: `${outcome.skippedStockFull.length} item(s) were already maxed out in your cart.`,
        });
      }

      invalidate();
    },
    onError: () => {
      // Deliberately do NOT reset lastMergedUserId here: the module-level guard
      // stops the effect from re-firing on every render, which would otherwise
      // turn a transient failure into a tight retry + toast loop. Retries now
      // happen on page reload or via the explicit "Try again" action.
      toast.error("Sync failed", {
        description: "Could not merge your guest cart. Items preserved locally.",
      });
    },
  });

  useEffect(() => {
    const userId = session?.user?.id;
    if (!isLoggedIn) {
      // Never touch the guard while the session query is still loading. A
      // component that mounts mid-fetch (e.g. a streamed product card) would
      // otherwise reset the guard and let a second instance re-run the merge,
      // double-adding the guest items to the server cart.
      if (!sessionLoading) {
        lastMergedUserId = null;
      }
      return;
    }

    if (
      userId &&
      lastMergedUserId !== userId &&
      !mergeMutation.isPending &&
      guestCart.items.length > 0
    ) {
      lastMergedUserId = userId;
      mergeAttemptedForUser = userId;
      mergeMutation.mutate(guestCart.items);
    }
  }, [isLoggedIn, sessionLoading, session?.user?.id, guestCart.items, mergeMutation.isPending, mergeMutation.mutate]);

  /* â”€â”€ Server cart query â”€â”€ */
  const query = useQuery({
    queryKey: ["cart"],
    queryFn: getCartAction,
    enabled: isLoggedIn,
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });

  /* â”€â”€ Mutations â”€â”€ */
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
      toast.error(err instanceof Error ? err.message : "Could not remove item");
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
      toast.error(err instanceof Error ? err.message : "Could not clear cart");
    },
  });

  /* â”€â”€ Unified API with Stock Validation â”€â”€ */
  const items = isLoggedIn ? (query.data ?? []) : guestCart.items;

  const addItem = (
    item: Omit<CartItem, "quantity">,
    quantity = 1,
  ) => {
    if (isLoggedIn) {
      addMutation.mutate({ productId: item.productId, quantity });
      return;
    }

    // â”€â”€ GUEST: validate stock before mutating store â”€â”€
    const existing = guestCart.items.find((i) => i.productId === item.productId);
    const currentQty = existing?.quantity ?? 0;
    const availableStock = item.stock ?? 0;

    if (availableStock <= 0) {
      toast.error("Out of stock", {
        description: "This item is currently unavailable.",
      });
      return;
    }

    if (currentQty + quantity > availableStock) {
      const remaining = availableStock - currentQty;
      toast.error("Stock limit reached", {
        description:
          remaining > 0
            ? `Only ${remaining} more available. (In stock: ${availableStock})`
            : "This item is out of stock.",
      });
      return;
    }

    guestCart.addItem(item, quantity);
    toast.success("Added to cart", {
      description: `${item.name} has been added.`,
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (isLoggedIn) {
      updateMutation.mutate({ productId, quantity });
      return;
    }

    // â”€â”€ GUEST: validate stock before mutating store â”€â”€
    const item = guestCart.items.find((i) => i.productId === productId);
    const availableStock = item?.stock ?? 0;

    if (quantity > 0 && quantity > availableStock) {
      toast.error("Stock limit reached", {
        description: `Only ${availableStock} units available.`,
      });
      return;
    }

    if (quantity <= 0) {
      guestCart.removeItem(productId);
      toast.success("Item removed");
    } else {
      guestCart.updateQuantity(productId, quantity);
      toast.success("Quantity updated");
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

  // Items from the guest store that are still pending a merge (a previous
  // merge failed for them, either partially or fully). While signed in these
  // are invisible in the cart UI, so the pending-merge banner surfaces them.
  const userId = session?.user?.id;
  const pendingGuestItems = isLoggedIn ? guestCart.items : [];
  const hasPendingMerge =
    isLoggedIn &&
    guestCart.items.length > 0 &&
    mergeAttemptedForUser === userId &&
    !mergeMutation.isPending;

  const retryPendingMerge = () => {
    if (!userId || guestCart.items.length === 0 || mergeMutation.isPending) {
      return;
    }
    lastMergedUserId = userId;
    mergeAttemptedForUser = userId;
    mergeMutation.mutate(guestCart.items);
  };

  const discardPendingGuestItems = () => {
    guestCart.clearCart();
  };

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
    pendingGuestItems,
    hasPendingMerge,
    retryPendingMerge,
    discardPendingGuestItems,
  };
}
