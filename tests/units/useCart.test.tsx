import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCart } from "@/hooks/useCart";
import type { CartItem } from "@/lib/types";
import { http, HttpResponse } from "msw";
import { server } from "@/tests/mocks/server";
import type { ReactNode } from "react";

const mockUseSession = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth/client", () => ({
  authClient: {
    useSession: mockUseSession,
  },
}));

const guestAddItem = vi.hoisted(() => vi.fn());
const guestRemoveItem = vi.hoisted(() => vi.fn());
const guestUpdateQuantity = vi.hoisted(() => vi.fn());
const guestClearCart = vi.hoisted(() => vi.fn());
const guestItems = vi.hoisted(() => ({ current: [] as CartItem[] }));

vi.mock("@/lib/cart/store", () => ({
  useGuestCart: () => ({
    items: guestItems.current,
    addItem: guestAddItem,
    removeItem: guestRemoveItem,
    updateQuantity: guestUpdateQuantity,
    clearCart: guestClearCart,
  }),
}));

const mockItem: CartItem = {
  variantId: "var-1",
  productId: "prod-1",
  slug: "latex-gloves",
  name: "Latex Gloves",
  price: 220,
  image: "/gloves.jpg",
  variantName: "Medium",
  quantity: 2,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useCart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    guestItems.current = [];
    mockUseSession.mockReturnValue({ data: null, isPending: false });
  });

  describe("guest mode (not logged in)", () => {
    it("returns empty items when guest cart is empty", () => {
      const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });
      expect(result.current.items).toEqual([]);
      expect(result.current.isLoggedIn).toBe(false);
    });

    it("returns guest cart items", () => {
      guestItems.current = [mockItem];
      const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });
      expect(result.current.items).toEqual([mockItem]);
    });

    it("addItem delegates to guestCart.addItem", () => {
      const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });
      const newItem = {
        variantId: "v2",
        productId: "p2",
        slug: "s",
        name: "n",
        price: 100,
        image: "",
        variantName: "S",
      };
      act(() => result.current.addItem(newItem, 3));
      expect(guestAddItem).toHaveBeenCalledWith(newItem, 3);
    });

    it("removeItem delegates to guestCart.removeItem", () => {
      guestItems.current = [mockItem];
      const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });
      act(() => result.current.removeItem("var-1"));
      expect(guestRemoveItem).toHaveBeenCalledWith("var-1");
    });

    it("updateQuantity delegates to guestCart.updateQuantity", () => {
      guestItems.current = [mockItem];
      const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });
      act(() => result.current.updateQuantity("var-1", 5));
      expect(guestUpdateQuantity).toHaveBeenCalledWith("var-1", 5);
    });

    it("computes totals from guest items", () => {
      guestItems.current = [
        { ...mockItem, quantity: 2 },
        { ...mockItem, variantId: "var-2", price: 100, quantity: 3 },
      ];
      const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });
      expect(result.current.totalItems).toBe(5);
      expect(result.current.totalPrice).toBe(220 * 2 + 100 * 3);
    });

    it("isLoading is false when session resolves (not logged in)", () => {
      const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });
      expect(result.current.isLoading).toBe(false);
    });

    it("isLoading is true while session is pending", () => {
      mockUseSession.mockReturnValue({ data: null, isPending: true });
      const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });
      expect(result.current.isLoading).toBe(true);
    });

    it("does not trigger merge when not logged in", () => {
      guestItems.current = [mockItem];
      renderHook(() => useCart(), { wrapper: createWrapper() });
      expect(guestClearCart).not.toHaveBeenCalled();
    });
  });

  describe("logged-in mode", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: { id: "1", name: "Test", email: "test@test.com" } },
        isPending: false,
      });
    });

    it("fetches server items from API", async () => {
      const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });
      await waitFor(() => {
        expect(result.current.items).toEqual([mockItem]);
      });
      expect(result.current.isLoggedIn).toBe(true);
    });

    it("addItem calls POST /api/cart", async () => {
      let capturedBody: unknown;
      server.use(
        http.post("/api/cart", async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({ success: true });
        }),
      );
      const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      act(() =>
        result.current.addItem({
          variantId: "v99",
          productId: "p99",
          slug: "s",
          name: "n",
          price: 10,
          image: "",
          variantName: "X",
        }),
      );
      await waitFor(() => expect(capturedBody).toBeDefined());
      expect(capturedBody).toEqual({ variantId: "v99", quantity: 1 });
    });

    it("removeItem calls DELETE /api/cart", async () => {
      let capturedUrl = "";
      server.use(
        http.delete("/api/cart", ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({ success: true });
        }),
      );
      const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      act(() => result.current.removeItem("var-1"));
      await waitFor(() => expect(capturedUrl).toContain("variantId=var-1"));
    });

    it("updateQuantity calls PATCH /api/cart with correct payload", async () => {
      let capturedBody: unknown;
      server.use(
        http.patch("/api/cart", async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({ success: true });
        }),
      );
      const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      act(() => result.current.updateQuantity("var-1", 5));
      await waitFor(() => expect(capturedBody).toBeDefined());
      expect(capturedBody).toEqual({ variantId: "var-1", quantity: 5 });
    });

    it("isLoading is true during initial fetch", () => {
      const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });
      expect(result.current.isLoading).toBe(true);
    });

    it("merges guest items into server on login and clears guest cart", async () => {
      guestItems.current = [mockItem];
      const { result } = renderHook(() => useCart(), { wrapper: createWrapper() });
      await waitFor(() => {
        expect(guestClearCart).toHaveBeenCalled();
      });
    });
  });
});
