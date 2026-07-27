import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import {
    addToCartAction,
    updateCartQuantityAction,
    removeFromCartAction,
    clearCartAction,
} from "@/lib/cart/actions";

// Mock auth, prisma, and headers
vi.mock("@/lib/auth/server", () => ({
    auth: {
        api: {
            getSession: vi.fn(),
        },
    },
}));

vi.mock("next/headers", () => ({
    headers: vi.fn(() => new Headers()),
}));

vi.mock("@/lib/config/prisma", () => ({
    default: {
        product: { findUnique: vi.fn() },
        cartItem: {
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            updateMany: vi.fn(),
            deleteMany: vi.fn(),
        },
    },
}));

import { auth } from "@/lib/auth/server";
import prisma from "@/lib/config/prisma";

const mockUser = { user: { id: "u1" } };

beforeEach(() => {
    vi.clearAllMocks();
    (auth.api.getSession as any).mockResolvedValue(mockUser);
});

describe("addToCartAction", () => {
    it("returns error when not authenticated", async () => {
        (auth.api.getSession as any).mockResolvedValue(null);
        const res = await addToCartAction("p1", 1);
        expect(res.success).toBe(false);
        expect(res.toast.title).toBe("Please sign in");
    });

    it("adds item when stock is available", async () => {
        (prisma.product.findUnique as any).mockResolvedValue({
            id: "p1",
            name: "Gloves",
            stock: 10,
            isActive: true,
        });
        (prisma.cartItem.findFirst as any).mockResolvedValue(null);
        (prisma.cartItem.create as any).mockResolvedValue({});

        const res = await addToCartAction("p1", 2);
        expect(res.success).toBe(true);
        expect(prisma.cartItem.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ userId: "u1", productId: "p1", quantity: 2 }),
            }),
        );
    });

    it("blocks add when stock limit exceeded", async () => {
        (prisma.product.findUnique as any).mockResolvedValue({
            id: "p1",
            name: "Gloves",
            stock: 3,
            isActive: true,
        });
        (prisma.cartItem.findFirst as any).mockResolvedValue({ quantity: 2 });

        const res = await addToCartAction("p1", 5);
        expect(res.success).toBe(false);
        expect(res.toast.title).toBe("Stock limit reached");
    });
});

describe("updateCartQuantityAction", () => {
    it("removes item when quantity <= 0", async () => {
        const res = await updateCartQuantityAction("p1", 0);
        expect(res.success).toBe(true);
        expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { userId: "u1", productId: "p1" } }),
        );
    });

    it("updates quantity when stock allows", async () => {
        (prisma.product.findUnique as any).mockResolvedValue({
            stock: 10,
            isActive: true,
        });

        const res = await updateCartQuantityAction("p1", 5);
        expect(res.success).toBe(true);
        expect(prisma.cartItem.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { userId: "u1", productId: "p1" },
                data: { quantity: 5 },
            }),
        );
    });
});

describe("clearCartAction", () => {
    it("deletes all cart items for user", async () => {
        const res = await clearCartAction();
        expect(res.success).toBe(true);
        expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { userId: "u1" } }),
        );
    });
});