import { describe, it, expect, beforeEach } from "vitest";
import { useGuestCart } from "@/lib/cart/store";

// helper — reset store state between tests
const resetStore = () => useGuestCart.setState({ items: [] });

const mockItem = {
  productId: "prod-1",
  slug: "latex-gloves",
  name: "Latex Gloves",
  price: 220,
  image: "/gloves.jpg",
};

describe("useGuestCart", () => {
  beforeEach(() => resetStore());

  it("starts with an empty cart", () => {
    expect(useGuestCart.getState().items).toHaveLength(0);
  });

  it("adds an item with default quantity 1", () => {
    useGuestCart.getState().addItem(mockItem);
    const items = useGuestCart.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(1);
    expect(items[0].productId).toBe("prod-1");
  });

  it("adds an item with custom quantity", () => {
    useGuestCart.getState().addItem(mockItem, 3);
    expect(useGuestCart.getState().items[0].quantity).toBe(3);
  });

  it("increments quantity when adding same product twice", () => {
    useGuestCart.getState().addItem(mockItem, 2);
    useGuestCart.getState().addItem(mockItem, 1);
    const items = useGuestCart.getState().items;
    expect(items).toHaveLength(1); // still one item
    expect(items[0].quantity).toBe(3); // quantity summed
  });

  it("removes an item by productId", () => {
    useGuestCart.getState().addItem(mockItem);
    useGuestCart.getState().removeItem("prod-1");
    expect(useGuestCart.getState().items).toHaveLength(0);
  });

  it("updates quantity of an existing item", () => {
    useGuestCart.getState().addItem(mockItem);
    useGuestCart.getState().updateQuantity("prod-1", 5);
    expect(useGuestCart.getState().items[0].quantity).toBe(5);
  });

  it("removes item when quantity updated to 0", () => {
    useGuestCart.getState().addItem(mockItem);
    useGuestCart.getState().updateQuantity("prod-1", 0);
    expect(useGuestCart.getState().items).toHaveLength(0);
  });

  it("removes item when quantity updated to negative", () => {
    useGuestCart.getState().addItem(mockItem);
    useGuestCart.getState().updateQuantity("prod-1", -1);
    expect(useGuestCart.getState().items).toHaveLength(0);
  });

  it("clears all items", () => {
    useGuestCart.getState().addItem(mockItem);
    useGuestCart.getState().addItem({ ...mockItem, productId: "prod-2" });
    useGuestCart.getState().clearCart();
    expect(useGuestCart.getState().items).toHaveLength(0);
  });

  it("calculates total items correctly", () => {
    useGuestCart.getState().addItem(mockItem, 2);
    useGuestCart.getState().addItem({ ...mockItem, productId: "prod-2" }, 3);
    const { items } = useGuestCart.getState();
    const total = items.reduce((s, i) => s + i.quantity, 0);
    expect(total).toBe(5);
  });
});
