import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { useGuestCart } from "@/lib/cart/store";
import type { CartItem } from "@/lib/types";

const { sessionState, actionsMock, toastMock } = vi.hoisted(() => ({
  sessionState: {
    data: null as { user: { id: string; name: string; email: string } } | null,
  },
  actionsMock: {
    addToCartAction: vi.fn(),
    getCartAction: vi.fn(),
    mergeCartAction: vi.fn(),
    removeFromCartAction: vi.fn(),
    updateCartQuantityAction: vi.fn(),
    clearCartAction: vi.fn(),
  },
  toastMock: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/auth/client", () => ({
  authClient: {
    useSession: () => ({ data: sessionState.data, isPending: false }),
  },
}));
vi.mock("@/lib/cart/actions", () => actionsMock);
vi.mock("sonner", () => ({ toast: toastMock }));

const baseProduct = {
  id: "p1",
  slug: "item-1",
  name: "Item 1",
  price: 100,
  stock: 10,
  images: ["https://r2.example.com/a.png"],
};

function renderButton(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

function seedCart(...items: CartItem[]) {
  useGuestCart.setState({ items });
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionState.data = null;
  useGuestCart.setState({ items: [] });
  localStorage.clear();
});

describe("AddToCartButton — card variant", () => {
  it("renders an icon-only add button", () => {
    renderButton(<AddToCartButton product={baseProduct} />);

    const btn = screen.getByRole("button", { name: "Add to cart" });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it("adds exactly one unit to the guest cart when clicked", async () => {
    const user = userEvent.setup();
    renderButton(<AddToCartButton product={baseProduct} />);

    await user.click(screen.getByRole("button", { name: "Add to cart" }));

    expect(useGuestCart.getState().items).toEqual([
      expect.objectContaining({ productId: "p1", quantity: 1 }),
    ]);
    expect(toastMock.success).toHaveBeenCalledWith("Added to cart", expect.anything());
  });

  it("does not bubble the click to a wrapping link (regression)", async () => {
    const user = userEvent.setup();
    const onLinkClick = vi.fn();

    renderButton(
      <a href="/shop/item-1" onClick={onLinkClick}>
        <AddToCartButton product={baseProduct} />
      </a>,
    );

    await user.click(screen.getByRole("button", { name: "Add to cart" }));

    expect(useGuestCart.getState().items).toHaveLength(1);
    expect(onLinkClick).not.toHaveBeenCalled();
  });

  it("is disabled when the product is out of stock", () => {
    renderButton(
      <AddToCartButton product={{ ...baseProduct, stock: 0 }} />,
    );

    expect(screen.getByRole("button", { name: "Add to cart" })).toBeDisabled();
  });

  it("is disabled when the cart already holds the full stock", () => {
    seedCart({
      productId: "p1",
      slug: "item-1",
      name: "Item 1",
      price: 100,
      image: "",
      quantity: 10,
      stock: 10,
    });
    renderButton(<AddToCartButton product={baseProduct} />);

    expect(screen.getByRole("button", { name: "Add to cart" })).toBeDisabled();
  });

  it("is enabled again once there is room below the stock limit", () => {
    seedCart({
      productId: "p1",
      slug: "item-1",
      name: "Item 1",
      price: 100,
      image: "",
      quantity: 3,
      stock: 10,
    });
    renderButton(<AddToCartButton product={baseProduct} />);

    expect(screen.getByRole("button", { name: "Add to cart" })).not.toBeDisabled();
  });
});
