import { describe, it, expect, beforeEach } from "vitest";
import { useGuestCart } from "@/lib/cart/store";
import type { CartItem } from "@/lib/types";

const base = {
  slug: "amalgam-capsule",
  name: "E2E Amalgam Capsule",
  price: 99.5,
  image: "https://r2.example.com/a.png",
  stock: 10,
};

function makeItem(overrides: Partial<CartItem> = {}): Omit<CartItem, "quantity"> {
  return { productId: "p1", ...base, ...overrides };
}

function getStored(): CartItem[] {
  const raw = localStorage.getItem("mds-cart");
  if (!raw) return [];
  return (JSON.parse(raw).state as { items: CartItem[] }).items;
}

describe("useGuestCart (zustand + persist)", () => {
  beforeEach(() => {
    useGuestCart.setState({ items: [] });
    localStorage.clear();
  });

  it("starts empty", () => {
    expect(useGuestCart.getState().items).toEqual([]);
  });

  it("adds a new item with the default quantity of 1", () => {
    useGuestCart.getState().addItem(makeItem({ productId: "p1" }));

    const items = useGuestCart.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      productId: "p1",
      slug: "amalgam-capsule",
      name: "E2E Amalgam Capsule",
      price: 99.5,
      quantity: 1,
      stock: 10,
    });
  });

  it("adds a new item with an explicit quantity", () => {
    useGuestCart.getState().addItem(makeItem({ productId: "p1" }), 3);

    expect(useGuestCart.getState().items[0].quantity).toBe(3);
  });

  it("merges the quantity when the product is already in the cart", () => {
    useGuestCart.getState().addItem(makeItem({ productId: "p1" }), 2);
    useGuestCart.getState().addItem(makeItem({ productId: "p1" }), 3);

    const items = useGuestCart.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(5);
  });

  it("keeps distinct entries for different products", () => {
    useGuestCart.getState().addItem(makeItem({ productId: "p1" }), 1);
    useGuestCart.getState().addItem(makeItem({ productId: "p2" }), 2);

    const items = useGuestCart.getState().items;
    expect(items).toHaveLength(2);
    expect(items[0].productId).toBe("p1");
    expect(items[1].productId).toBe("p2");
  });

  it("removes an item by product id", () => {
    useGuestCart.getState().addItem(makeItem({ productId: "p1" }));
    useGuestCart.getState().addItem(makeItem({ productId: "p2" }));

    useGuestCart.getState().removeItem("p1");

    const items = useGuestCart.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe("p2");
  });

  it("is a no-op when removing a product that is not in the cart", () => {
    useGuestCart.getState().addItem(makeItem({ productId: "p1" }));
    useGuestCart.getState().removeItem("nope");

    expect(useGuestCart.getState().items).toHaveLength(1);
  });

  it("sets the exact quantity via updateQuantity", () => {
    useGuestCart.getState().addItem(makeItem({ productId: "p1" }), 1);
    useGuestCart.getState().updateQuantity("p1", 7);

    expect(useGuestCart.getState().items[0].quantity).toBe(7);
  });

  it("removes the item when updateQuantity is called with 0", () => {
    useGuestCart.getState().addItem(makeItem({ productId: "p1" }));
    useGuestCart.getState().updateQuantity("p1", 0);

    expect(useGuestCart.getState().items).toEqual([]);
  });

  it("removes the item when updateQuantity is called with a negative number", () => {
    useGuestCart.getState().addItem(makeItem({ productId: "p1" }));
    useGuestCart.getState().updateQuantity("p1", -2);

    expect(useGuestCart.getState().items).toEqual([]);
  });

  it("is a no-op when updating a product that is not in the cart", () => {
    useGuestCart.getState().addItem(makeItem({ productId: "p1" }));
    useGuestCart.getState().updateQuantity("missing", 5);

    expect(useGuestCart.getState().items).toHaveLength(1);
  });

  it("clears the whole cart", () => {
    useGuestCart.getState().addItem(makeItem({ productId: "p1" }));
    useGuestCart.getState().addItem(makeItem({ productId: "p2" }));

    useGuestCart.getState().clearCart();

    expect(useGuestCart.getState().items).toEqual([]);
  });

  it("persists items to localStorage under the mds-cart key", () => {
    useGuestCart.getState().addItem(makeItem({ productId: "p1" }), 2);

    expect(getStored()).toHaveLength(1);
    expect(getStored()[0]).toMatchObject({ productId: "p1", quantity: 2 });
  });

  it("keeps localStorage in sync when items are removed", () => {
    useGuestCart.getState().addItem(makeItem({ productId: "p1" }));
    useGuestCart.getState().addItem(makeItem({ productId: "p2" }));

    useGuestCart.getState().removeItem("p1");

    expect(getStored().map((i) => i.productId)).toEqual(["p2"]);
  });
});
