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

    expect(screen.getByRole("link", { name: item.name })).toHaveAttribute(
      "href",
      "/shop/amalgam-capsule",
    );
    expect(screen.getByText("99.5 EGP")).toBeInTheDocument();
    expect(screen.getByDisplayValue("3")).toBeInTheDocument();
    expect(screen.getByText("298.5 EGP")).toBeInTheDocument();
  });

  it("calls onUpdateQuantity with the next quantity when increasing", async () => {
    const user = userEvent.setup();
    const { onUpdateQuantity } = setup();

    await user.click(screen.getByRole("button", { name: "Increase quantity" }));

    expect(onUpdateQuantity).toHaveBeenCalledWith("p1", 4);
  });

  it("calls onUpdateQuantity with the previous quantity when decreasing", async () => {
    const user = userEvent.setup();
    const { onUpdateQuantity } = setup();

    await user.click(screen.getByRole("button", { name: "Decrease quantity" }));

    expect(onUpdateQuantity).toHaveBeenCalledWith("p1", 2);
  });

  it("calls onRemove with the product id when removing", async () => {
    const user = userEvent.setup();
    const { onRemove } = setup();

    await user.click(screen.getByRole("button", { name: /remove/i }));

    expect(onRemove).toHaveBeenCalledWith("p1");
  });

  it("recalculates the subtotal for a different quantity", () => {
    setup({ quantity: 2 });

    expect(screen.getByText("199 EGP")).toBeInTheDocument();
  });

  it("disables the increase button when the cart holds the full stock", () => {
    setup({ quantity: 10, stock: 10 });

    expect(
      screen.getByRole("button", { name: "Increase quantity" }),
    ).toBeDisabled();
  });

  it("keeps the increase button enabled below the stock limit", () => {
    setup({ quantity: 9, stock: 10 });

    expect(
      screen.getByRole("button", { name: "Increase quantity" }),
    ).not.toBeDisabled();
  });
});
