import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCart } from "@/hooks/useCart";

vi.mock("@/lib/auth/client", () => ({
    authClient: {
        useSession: vi.fn(),
    },
}));

vi.mock("@/lib/cart/actions", () => ({
    getCartAction: vi.fn(),
    addToCartAction: vi.fn(),
    updateCartQuantityAction: vi.fn(),
    removeFromCartAction: vi.fn(),
    clearCartAction: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { authClient } from "@/lib/auth/client";
import { addToCartAction, getCartAction } from "@/lib/cart/actions";
import { useGuestCart } from "@/lib/cart/store";

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe("useCart merge", () => {
    beforeEach(() => {
        useGuestCart.setState({ items: [] });
        vi.clearAllMocks();
    });

    it("merges guest cart exactly once when multiple hook instances mount", async () => {
        let sessionValue: any = { data: null, isPending: false };
        (authClient.useSession as any).mockImplementation(() => sessionValue);
        (getCartAction as any).mockResolvedValue([]);
        (addToCartAction as any).mockResolvedValue({
            success: true,
            toast: { type: "success", title: "Added" },
        });

        // 1. Logged out — add guest items
        const { result: r1, rerender: rerender1 } = renderHook(() => useCart(), {
            wrapper: createWrapper(),
        });

        act(() => {
            r1.current.addItem(
                { productId: "p1", slug: "x", name: "X", price: 10, image: "" },
                1,
            );
            r1.current.addItem(
                { productId: "p2", slug: "y", name: "Y", price: 20, image: "" },
                1,
            );
        });

        expect(r1.current.totalItems).toBe(2);

        // 2. Log in
        sessionValue = { data: { user: { id: "u1" } }, isPending: false };
        rerender1();

        // 3. Mount a SECOND instance (simulates CartButton + CartPage both mounting)
        const { result: r2 } = renderHook(() => useCart(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(addToCartAction).toHaveBeenCalled());

        // Should be called exactly once per item (2 total), NOT 4
        expect(addToCartAction).toHaveBeenCalledTimes(2);
        expect(addToCartAction).toHaveBeenCalledWith("p1", 1);
        expect(addToCartAction).toHaveBeenCalledWith("p2", 1);

        // Guest cart should be cleared
        await waitFor(() => {
            expect(useGuestCart.getState().items).toHaveLength(0);
        });
    });

    it("preserves guest items that failed to merge", async () => {
        let sessionValue: any = { data: { user: { id: "u1" } }, isPending: false };
        (authClient.useSession as any).mockImplementation(() => sessionValue);
        (getCartAction as any).mockResolvedValue([]);

        (addToCartAction as any).mockImplementation((pid: string) =>
            pid === "p1"
                ? Promise.resolve({ success: true, toast: { title: "OK" } })
                : Promise.resolve({
                    success: false,
                    toast: { title: "Out of stock" },
                }),
        );

        const { result } = renderHook(() => useCart(), {
            wrapper: createWrapper(),
        });

        act(() => {
            result.current.addItem(
                { productId: "p1", slug: "x", name: "X", price: 10, image: "" },
                1,
            );
            result.current.addItem(
                { productId: "p2", slug: "y", name: "Y", price: 20, image: "" },
                1,
            );
        });

        await waitFor(() => expect(addToCartAction).toHaveBeenCalledTimes(2));

        // p2 should remain in guest cart
        expect(useGuestCart.getState().items).toHaveLength(1);
        expect(useGuestCart.getState().items[0].productId).toBe("p2");
    });
});