import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { useGuestCart } from "@/lib/cart/store";
import type { CartItem } from "@/lib/types";

const { sessionState, actionsMock } = vi.hoisted(() => ({
  sessionState: {
    data: null as {
      user: { id: string; name: string; email: string };
    } | null,
    isPending: false,
  },
  actionsMock: {
    addToCartAction: vi.fn(),
    getCartAction: vi.fn(),
    mergeCartAction: vi.fn(),
    removeFromCartAction: vi.fn(),
    updateCartQuantityAction: vi.fn(),
    clearCartAction: vi.fn(),
  },
}));

vi.mock("@/lib/auth/client", () => ({
  authClient: {
    useSession: () => ({ data: sessionState.data, isPending: sessionState.isPending }),
  },
}));
vi.mock("@/lib/cart/actions", () => actionsMock);
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

const SESSION = { user: { id: "u1", name: "Tester", email: "t@example.com" } };

function sessionFor(id: string) {
  return { user: { id, name: "Tester", email: `${id}@example.com` } };
}

function item(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: "p1",
    slug: "item-1",
    name: "Item 1",
    price: 100,
    image: "",
    quantity: 1,
    stock: 10,
    ...overrides,
  };
}

function setup({ session = null }: { session?: typeof SESSION | null } = {}) {
  sessionState.data = session;
  sessionState.isPending = false;

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper, queryClient };
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionState.data = null;
  sessionState.isPending = false;
  useGuestCart.setState({ items: [] });
  localStorage.clear();
});

describe("useCart â€” guest mode", () => {
  it("adds a valid item to the guest store and shows a success toast", () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() =>
      result.current.addItem(
        { productId: "p1", slug: "item-1", name: "Item 1", price: 100, image: "", stock: 10 },
        2,
      ),
    );

    expect(useGuestCart.getState().items).toEqual([
      expect.objectContaining({ productId: "p1", quantity: 2 }),
    ]);
    expect(toast.success).toHaveBeenCalledWith("Added to cart", expect.anything());
  });

  it("merges the quantity when adding the same product twice", () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addItem(item(), 2));
    act(() => result.current.addItem(item(), 3));

    expect(useGuestCart.getState().items[0].quantity).toBe(5);
  });

  it("blocks out-of-stock items and does not mutate the store", () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() =>
      result.current.addItem(
        { productId: "p1", slug: "item-1", name: "Item 1", price: 100, image: "", stock: 0 },
        1,
      ),
    );

    expect(useGuestCart.getState().items).toEqual([]);
    expect(toast.error).toHaveBeenCalledWith("Out of stock", expect.anything());
  });

  it("blocks additions that exceed the stock limit", () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addItem(item({ stock: 5 }), 4));
    act(() => result.current.addItem(item({ stock: 5 }), 2));

    expect(useGuestCart.getState().items[0].quantity).toBe(4);
    expect(toast.error).toHaveBeenCalledWith("Stock limit reached", expect.anything());
  });

  it("blocks updates that exceed the stock limit", () => {
    useGuestCart.setState({ items: [item({ quantity: 2, stock: 5 })] });
    const { wrapper } = setup();
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.updateQuantity("p1", 9));

    expect(useGuestCart.getState().items[0].quantity).toBe(2);
    expect(toast.error).toHaveBeenCalledWith("Stock limit reached", expect.anything());
  });

  it("removes an item when the quantity is updated to 0", () => {
    useGuestCart.setState({ items: [item()] });
    const { wrapper } = setup();
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.updateQuantity("p1", 0));

    expect(useGuestCart.getState().items).toEqual([]);
    expect(toast.success).toHaveBeenCalledWith("Item removed");
  });

  it("removes an item and shows a toast", () => {
    useGuestCart.setState({ items: [item()] });
    const { wrapper } = setup();
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.removeItem("p1"));

    expect(useGuestCart.getState().items).toEqual([]);
    expect(toast.success).toHaveBeenCalledWith("Item removed", expect.anything());
  });

  it("clears the whole guest cart", () => {
    useGuestCart.setState({ items: [item(), item({ productId: "p2" })] });
    const { wrapper } = setup();
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.clearCart());

    expect(useGuestCart.getState().items).toEqual([]);
  });

  it("computes totals from the guest items", () => {
    useGuestCart.setState({
      items: [
        item({ quantity: 2, price: 100 }),
        item({ productId: "p2", slug: "item-2", name: "Item 2", quantity: 3, price: 50 }),
      ],
    });
    const { wrapper } = setup();
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.totalItems).toBe(5);
    expect(result.current.totalPrice).toBe(350);
  });

  it("never touches server actions for guest add/update/remove/clear", () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addItem(item(), 1));
    act(() => result.current.updateQuantity("p1", 2));
    act(() => result.current.removeItem("p1"));
    act(() => result.current.clearCart());

    expect(actionsMock.addToCartAction).not.toHaveBeenCalled();
    expect(actionsMock.updateCartQuantityAction).not.toHaveBeenCalled();
    expect(actionsMock.removeFromCartAction).not.toHaveBeenCalled();
    expect(actionsMock.clearCartAction).not.toHaveBeenCalled();
  });
});

describe("useCart â€” signed-in mode", () => {
  it("routes addItem through the addToCartAction server action", async () => {
    actionsMock.addToCartAction.mockResolvedValue({
      success: true,
      toast: { type: "success", title: "Added to cart", description: "Item 1 has been added." },
    });
    actionsMock.getCartAction.mockResolvedValue([]);

    const { wrapper } = setup({ session: SESSION });
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addItem(item(), 3));

    await waitFor(() =>
      expect(actionsMock.addToCartAction).toHaveBeenCalledWith("p1", 3),
    );
    expect(useGuestCart.getState().items).toEqual([]);
  });

  it("reads items from the server cart query", async () => {
    actionsMock.getCartAction.mockResolvedValue([item({ quantity: 4 })]);

    const { wrapper } = setup({ session: SESSION });
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0]).toMatchObject({ productId: "p1", quantity: 4 });
  });

  it("routes updateQuantity through the server action", async () => {
    actionsMock.updateCartQuantityAction.mockResolvedValue({
      success: true,
      toast: { type: "success", title: "Quantity updated" },
    });
    actionsMock.getCartAction.mockResolvedValue([]);

    const { wrapper } = setup({ session: SESSION });
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.updateQuantity("p1", 7));

    await waitFor(() =>
      expect(actionsMock.updateCartQuantityAction).toHaveBeenCalledWith("p1", 7),
    );
  });

  it("routes removeItem and clearCart through server actions", async () => {
    actionsMock.removeFromCartAction.mockResolvedValue({
      success: true,
      toast: { type: "success", title: "Item removed" },
    });
    actionsMock.clearCartAction.mockResolvedValue({
      success: true,
      toast: { type: "success", title: "Cart cleared" },
    });
    actionsMock.getCartAction.mockResolvedValue([]);

    const { wrapper } = setup({ session: SESSION });
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.removeItem("p1"));
    act(() => result.current.clearCart());

    await waitFor(() =>
      expect(actionsMock.removeFromCartAction).toHaveBeenCalledWith("p1"),
    );
    await waitFor(() => expect(actionsMock.clearCartAction).toHaveBeenCalled());
  });

  it("shows an error toast when the server rejects an add", async () => {
    actionsMock.addToCartAction.mockResolvedValue({
      success: false,
      toast: { type: "error", title: "Stock limit reached" },
    });
    actionsMock.getCartAction.mockResolvedValue([]);

    const { wrapper } = setup({ session: SESSION });
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addItem(item(), 1));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Stock limit reached"),
    );
  });
});

describe("useCart â€” merge guest cart on login", () => {
  it("does not trigger a merge while logged out", async () => {
    useGuestCart.setState({ items: [item()] });
    const { wrapper } = setup();
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {});

    expect(actionsMock.mergeCartAction).not.toHaveBeenCalled();
    expect(useGuestCart.getState().items).toHaveLength(1);
  });

  it("does not trigger a merge when the guest cart is empty", async () => {
    const { wrapper } = setup({ session: SESSION });
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(result.current.isLoggedIn).toBe(true));

    expect(actionsMock.mergeCartAction).not.toHaveBeenCalled();
  });

  it("merges guest items into the server cart on login and clears the guest store", async () => {
    useGuestCart.setState({
      items: [item({ quantity: 1 }), item({ productId: "p2", quantity: 2 })],
    });
    actionsMock.mergeCartAction.mockResolvedValue({
      added: [
        { productId: "p1", quantity: 1, requestedQuantity: 1 },
        { productId: "p2", quantity: 2, requestedQuantity: 2 },
      ],
      skippedStockFull: [],
      unavailable: [],
      pending: [],
    });
    actionsMock.getCartAction.mockResolvedValue([]);

    const { wrapper } = setup({ session: SESSION });
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(actionsMock.mergeCartAction).toHaveBeenCalled());

    expect(actionsMock.mergeCartAction).toHaveBeenCalledWith([
      { productId: "p1", quantity: 1 },
      { productId: "p2", quantity: 2 },
    ]);

    await waitFor(() => expect(useGuestCart.getState().items).toEqual([]));
    expect(toast.success).toHaveBeenCalledWith("Cart synced", expect.anything());
  });

  it("reports stock-limited merges and still clears the local copies", async () => {
    useGuestCart.setState({
      items: [
        item({ productId: "p1", quantity: 3 }),
        item({ productId: "p2", quantity: 2 }),
      ],
    });
    actionsMock.mergeCartAction.mockResolvedValue({
      // wanted 3, only 2 stored; p2 gone from catalog entirely
      added: [{ productId: "p1", quantity: 2, requestedQuantity: 3 }],
      skippedStockFull: [],
      unavailable: ["p2"],
      pending: [],
    });
    actionsMock.getCartAction.mockResolvedValue([]);

    const { wrapper } = setup({ session: sessionFor("merge-clamp") });
    renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(useGuestCart.getState().items).toEqual([]));
    expect(toast.success).toHaveBeenCalledWith(
      "Cart synced (stock-limited)",
      expect.anything(),
    );
    expect(toast.error).toHaveBeenCalledWith(
      "1 item(s) removed",
      expect.anything(),
    );
  });

  it("discards already-maxed items as skippedStockFull", async () => {
    useGuestCart.setState({ items: [item()] });
    actionsMock.mergeCartAction.mockResolvedValue({
      added: [],
      skippedStockFull: ["p1"],
      unavailable: [],
      pending: [],
    });
    actionsMock.getCartAction.mockResolvedValue([]);

    const { wrapper } = setup({ session: sessionFor("merge-full") });
    renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(useGuestCart.getState().items).toEqual([]));
    expect(toast.warning).toHaveBeenCalledWith(
      "Already at stock limit",
      expect.anything(),
    );
  });

  it("keeps only pending items locally when part of the merge was not processed", async () => {
    useGuestCart.setState({
      items: [
        item({ productId: "p1", quantity: 1 }),
        item({ productId: "p2", quantity: 2 }),
      ],
    });
    actionsMock.mergeCartAction.mockResolvedValue({
      added: [{ productId: "p2", quantity: 2, requestedQuantity: 2 }],
      skippedStockFull: [],
      unavailable: [],
      pending: ["p1"],
    });
    actionsMock.getCartAction.mockResolvedValue([]);

    const { wrapper } = setup({ session: sessionFor("merge-partial") });
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(actionsMock.mergeCartAction).toHaveBeenCalled());

    await waitFor(() =>
      expect(useGuestCart.getState().items.map((i) => i.productId)).toEqual(["p1"]),
    );
    await waitFor(() => expect(result.current.hasPendingMerge).toBe(true));
    expect(result.current.pendingGuestItems.map((i) => i.productId)).toEqual(["p1"]);
  });

  it("keeps every item pending when nothing could be processed (no silent drop)", async () => {
    useGuestCart.setState({ items: [item()] });
    actionsMock.mergeCartAction.mockResolvedValue({
      added: [],
      skippedStockFull: [],
      unavailable: [],
      pending: ["p1"],
    });
    actionsMock.getCartAction.mockResolvedValue([]);

    const { wrapper } = setup({ session: sessionFor("merge-pending-all") });
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(actionsMock.mergeCartAction).toHaveBeenCalled());
    await waitFor(() => expect(result.current.hasPendingMerge).toBe(true));
    expect(useGuestCart.getState().items).toHaveLength(1);
  });

  it("does not re-run the merge for the same user after a re-render", async () => {
    useGuestCart.setState({ items: [item()] });
    actionsMock.mergeCartAction.mockResolvedValue({
      added: [{ productId: "p1", quantity: 1, requestedQuantity: 1 }],
      skippedStockFull: [],
      unavailable: [],
      pending: [],
    });
    actionsMock.getCartAction.mockResolvedValue([]);

    const { wrapper } = setup({ session: sessionFor("merge-rerender") });
    const { result, rerender } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(actionsMock.mergeCartAction).toHaveBeenCalledTimes(1));

    rerender();
    await new Promise((r) => setTimeout(r, 50));

    expect(actionsMock.mergeCartAction).toHaveBeenCalledTimes(1);
  });

  it("exposes isMerging while the merge is in flight", async () => {
    let resolveMerge: (v: unknown) => void = () => {};
    actionsMock.mergeCartAction.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveMerge = resolve;
        }),
    );
    actionsMock.getCartAction.mockResolvedValue([]);
    useGuestCart.setState({ items: [item()] });

    const { wrapper } = setup({ session: sessionFor("merge-inflight") });
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(result.current.isMerging).toBe(true));

    await act(async () => {
      resolveMerge({
        added: [{ productId: "p1", quantity: 1, requestedQuantity: 1 }],
        skippedStockFull: [],
        unavailable: [],
        pending: [],
      });
    });

    await waitFor(() => expect(result.current.isMerging).toBe(false));
  });

  it("clears the server cart query cache after a successful merge", async () => {
    useGuestCart.setState({ items: [item()] });
    actionsMock.mergeCartAction.mockResolvedValue({
      added: [{ productId: "p1", quantity: 1, requestedQuantity: 1 }],
      skippedStockFull: [],
      unavailable: [],
      pending: [],
    });
    actionsMock.getCartAction.mockResolvedValue([item()]);

    const { wrapper } = setup({ session: sessionFor("merge-cache") });
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(actionsMock.mergeCartAction).toHaveBeenCalled());
    await waitFor(() => expect(result.current.items).toHaveLength(1));
  });

  it("does not re-run the merge when the action throws (no retry loop)", async () => {
    useGuestCart.setState({ items: [item()] });
    actionsMock.mergeCartAction.mockRejectedValue(new Error("network down"));
    actionsMock.getCartAction.mockResolvedValue([]);

    const { wrapper } = setup({ session: sessionFor("merge-throw") });
    renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(actionsMock.mergeCartAction).toHaveBeenCalledTimes(1));
    await new Promise((r) => setTimeout(r, 100));

    expect(actionsMock.mergeCartAction).toHaveBeenCalledTimes(1);
    expect(useGuestCart.getState().items).toHaveLength(1);
    expect(toast.error).toHaveBeenCalledWith("Sync failed", expect.anything());
  });

  it("retryPendingMerge re-merges the remaining guest items", async () => {
    useGuestCart.setState({ items: [item()] });
    actionsMock.mergeCartAction
      .mockResolvedValueOnce({
        added: [],
        skippedStockFull: [],
        unavailable: [],
        pending: ["p1"],
      })
      .mockResolvedValueOnce({
        added: [{ productId: "p1", quantity: 1, requestedQuantity: 1 }],
        skippedStockFull: [],
        unavailable: [],
        pending: [],
      });
    actionsMock.getCartAction.mockResolvedValue([]);

    const { wrapper } = setup({ session: sessionFor("merge-retry") });
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(actionsMock.mergeCartAction).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.hasPendingMerge).toBe(true));

    await act(async () => {
      result.current.retryPendingMerge();
    });

    await waitFor(() => expect(actionsMock.mergeCartAction).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.hasPendingMerge).toBe(false));
    expect(useGuestCart.getState().items).toEqual([]);
  });

  it("discardPendingGuestItems clears the pending items", async () => {
    useGuestCart.setState({ items: [item()] });
    actionsMock.mergeCartAction.mockResolvedValue({
      added: [],
      skippedStockFull: [],
      unavailable: [],
      pending: ["p1"],
    });
    actionsMock.getCartAction.mockResolvedValue([]);

    const { wrapper } = setup({ session: sessionFor("merge-discard") });
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(result.current.hasPendingMerge).toBe(true));

    await act(async () => {
      result.current.discardPendingGuestItems();
    });

    expect(useGuestCart.getState().items).toEqual([]);
    expect(result.current.hasPendingMerge).toBe(false);
  });
});
