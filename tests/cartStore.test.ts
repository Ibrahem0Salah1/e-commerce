import { describe, it, expect, beforeEach } from "vitest";
import { useGuestCart } from "@/lib/cart/store";

describe("useGuestCart", () => {
    beforeEach(() => {
        useGuestCart.setState({ items: [] });
    });

    const sampleItem = {
        productId: "p1",
        slug: "gloves",
        name: "Nitrile Gloves",
        price: 50,
        image: "/gloves.jpg",
    };

    it("adds a new item", () => {
        useGuestCart.getState().addItem(sampleItem, 2);
        const items = useGuestCart.getState().items;
        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({ ...sampleItem, quantity: 2 });
    });

    it("increments quantity for existing item", () => {
        useGuestCart.getState().addItem(sampleItem, 1);
        useGuestCart.getState().addItem(sampleItem, 3);
        const items = useGuestCart.getState().items;
        expect(items).toHaveLength(1);
        expect(items[0].quantity).toBe(4);
    });

    it("removes an item", () => {
        useGuestCart.getState().addItem(sampleItem, 1);
        useGuestCart.getState().removeItem("p1");
        expect(useGuestCart.getState().items).toHaveLength(0);
    });

    it("updates quantity", () => {
        useGuestCart.getState().addItem(sampleItem, 1);
        useGuestCart.getState().updateQuantity("p1", 5);
        expect(useGuestCart.getState().items[0].quantity).toBe(5);
    });

    it("deletes item when quantity updated to 0", () => {
        useGuestCart.getState().addItem(sampleItem, 3);
        useGuestCart.getState().updateQuantity("p1", 0);
        expect(useGuestCart.getState().items).toHaveLength(0);
    });

    it("clears the cart", () => {
        useGuestCart.getState().addItem(sampleItem, 1);
        useGuestCart.getState().addItem({ ...sampleItem, productId: "p2" }, 2);
        useGuestCart.getState().clearCart();
        expect(useGuestCart.getState().items).toHaveLength(0);
    });
});