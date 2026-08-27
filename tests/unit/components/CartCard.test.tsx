import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartCard } from "@/components/cart/CartCard";
import type { CartItem } from "@/lib/types";

const item: CartItem = {
  productId: "p1",
  slug: "amalgam-capsule",
  name: "E2E Amalgam Capsule",
  price: 99.5,
  image: "https://r2.example.com/a.png",
  quantity: 3,
  stock: 10,
};

function setup(overrides: Partial<CartItem> = {}) {
  const onUpdateQuantity = vi.fn();
  const onRemove = vi.fn();
  render(
    <CartCard
      item={{ ...item, ...overrides }}
      onUpdateQuantity={onUpdateQuantity}
      onRemove={onRemove}
    />,
  );
  return { onUpdateQuantity, onRemove };
}

describe("CartCard", () => {
  it("renders the product name, unit price, quantity and subtotal", () => {
    setup();

    // link appears twice (mobile + desktop) — pick first
    expect(screen.getAllByRole("link", { name: item.name })[0]).toHaveAttribute(
      "href",
      "/shop/amalgam-capsule",
    );
    expect(screen.getAllByText("99.5 EGP").length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue("3")).toBeInTheDocument();
    expect(screen.getAllByText("298.5 EGP").length).toBeGreaterThan(0);
  });

  it("calls onUpdateQuantity with the next quantity when increasing", async () => {
    const user = userEvent.setup();
    const { onUpdateQuantity } = setup();

    await user.click(screen.getAllByRole("button", { name: "Increase quantity" })[0]);

    expect(onUpdateQuantity).toHaveBeenCalledWith("p1", 4);
  });

  it("calls onUpdateQuantity with the previous quantity when decreasing", async () => {
    const user = userEvent.setup();
    const { onUpdateQuantity } = setup();

    await user.click(screen.getAllByRole("button", { name: "Decrease quantity" })[0]);

    expect(onUpdateQuantity).toHaveBeenCalledWith("p1", 2);
  });

  it("calls onRemove with the product id when removing", async () => {
    const user = userEvent.setup();
    const { onRemove } = setup();

    await user.click(screen.getAllByRole("button", { name: /remove/i })[0]);

    expect(onRemove).toHaveBeenCalledWith("p1");
  });

  it("recalculates the subtotal for a different quantity", () => {
    setup({ quantity: 2 });

    expect(screen.getAllByText("199 EGP").length).toBeGreaterThan(0);
  });

  it("disables the increase button when the cart holds the full stock", () => {
    setup({ quantity: 10, stock: 10 });

    const buttons = screen.getAllByRole("button", { name: "Increase quantity" });
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it("keeps the increase button enabled below the stock limit", () => {
    setup({ quantity: 9, stock: 10 });

    const buttons = screen.getAllByRole("button", { name: "Increase quantity" });
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((btn) => expect(btn).not.toBeDisabled());
  });
});
