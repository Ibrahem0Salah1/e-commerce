// lib/cart/store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem } from "@/lib/types";

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useGuestCart = create(
  persist<CartState>(
    (set) => ({
      items: [],

      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId,
          );

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + quantity }
                  : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) =>
          quantity <= 0
            ? { items: state.items.filter((i) => i.productId !== productId) }
            : {
                items: state.items.map((i) =>
                  i.productId === productId ? { ...i, quantity } : i,
                ),
              },
        ),

      clearCart: () => set({ items: [] }),
    }),
    { name: "mds-cart", storage: createJSONStorage(() => localStorage) },
  ),
);