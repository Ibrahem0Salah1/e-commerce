import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before imports
vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

vi.mock("@/lib/auth/server", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/lib/config/prisma", () => ({
  default: {
    product: {
      findUnique: vi.fn(),
    },
    cartItem: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/cart/queries", () => ({
  fetchCartItems: vi.fn(),
}));

import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import prisma from "@/lib/config/prisma";
import { fetchCartItems } from "@/lib/cart/queries";
import {
  getCartAction,
  addToCartAction,
  updateCartQuantityAction,
  removeFromCartAction,
} from "@/lib/cart/actions";

const mockSession = {
  user: { id: "user-1", name: "Test User", email: "test@example.com" },
};

const mockProduct = {
  id: "prod-1",
  price: 220,
  stock: 10,
  isActive: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(headers).mockResolvedValue(new Headers());
});

// ─── getCartAction ───────────────────────────────────────────────────────────

describe("getCartAction", () => {
  it("returns empty array when not logged in", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const result = await getCartAction();
    expect(result).toEqual([]);
  });

  it("fetches cart items when logged in", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    const mockItems = [{ productId: "prod-1", quantity: 2 }];
    vi.mocked(fetchCartItems).mockResolvedValue(mockItems as any);

    const result = await getCartAction();

    expect(fetchCartItems).toHaveBeenCalledWith("user-1");
    expect(result).toEqual(mockItems);
  });
});

// ─── addToCartAction ─────────────────────────────────────────────────────────

describe("addToCartAction", () => {
  it("returns error when not logged in", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const result = await addToCartAction("prod-1");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.toast.title).toBe("Please sign in");
    }
  });

  it("returns error when product not found", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

    const result = await addToCartAction("prod-999");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.toast.title).toBe("Product unavailable");
    }
  });

  it("returns error when product is inactive", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      ...mockProduct,
      isActive: false,
    });

    const result = await addToCartAction("prod-1");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.toast.title).toBe("Product unavailable");
    }
  });

  it("returns error when product is out of stock", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      ...mockProduct,
      stock: 0,
    });
    vi.mocked(prisma.cartItem.findFirst).mockResolvedValue(null);

    const result = await addToCartAction("prod-1");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.toast.title).toBe("Out of stock");
    }
  });

  it("returns error when adding more than available stock", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      ...mockProduct,
      stock: 5,
    });
    vi.mocked(prisma.cartItem.findFirst).mockResolvedValue({
      id: "cart-1",
      quantity: 3,
    });

    const result = await addToCartAction("prod-1", 3); // 3 + 3 = 6 > 5
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.toast.title).toBe("Stock limit reached");
      expect(result.toast.description).toContain("2 more");
    }
  });

  it("adds item to cart successfully", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct);
    vi.mocked(prisma.cartItem.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.cartItem.create).mockResolvedValue({} as any);

    const result = await addToCartAction("prod-1", 2);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.toast.title).toBe("Added to cart");
    }
    expect(prisma.cartItem.create).toHaveBeenCalledWith({
      data: { userId: "user-1", productId: "prod-1", quantity: 2 },
    });
  });

  it("uses default quantity of 1", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct);
    vi.mocked(prisma.cartItem.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.cartItem.create).mockResolvedValue({} as any);

    await addToCartAction("prod-1");
    expect(prisma.cartItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ quantity: 1 }),
      })
    );
  });

  it("increments existing cart item quantity", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      ...mockProduct,
      stock: 10,
    });
    vi.mocked(prisma.cartItem.findFirst).mockResolvedValue({
      id: "cart-1",
      quantity: 2,
    });
    vi.mocked(prisma.cartItem.update).mockResolvedValue({} as any);

    const result = await addToCartAction("prod-1", 2);
    expect(result.success).toBe(true);
    expect(prisma.cartItem.update).toHaveBeenCalledWith({
      where: { id: "cart-1" },
      data: { quantity: { increment: 2 } },
    });
  });

  it("allows adding when no existing cart item and quantity <= stock", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      ...mockProduct,
      stock: 3,
    });
    vi.mocked(prisma.cartItem.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.cartItem.create).mockResolvedValue({} as any);

    const result = await addToCartAction("prod-1", 3);
    expect(result.success).toBe(true);
  });
});

// ─── updateCartQuantityAction ────────────────────────────────────────────────

describe("updateCartQuantityAction", () => {
  it("returns error when not logged in", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const result = await updateCartQuantityAction("prod-1", 5);
    expect(result.success).toBe(false);
  });

  it("removes item when quantity <= 0", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.cartItem.deleteMany).mockResolvedValue({ count: 1 });

    const result = await updateCartQuantityAction("prod-1", 0);
    expect(result.success).toBe(true);
    expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", productId: "prod-1" },
    });
  });

  it("removes item when quantity is negative", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.cartItem.deleteMany).mockResolvedValue({ count: 1 });

    const result = await updateCartQuantityAction("prod-1", -5);
    expect(result.success).toBe(true);
    expect(prisma.cartItem.deleteMany).toHaveBeenCalled();
  });

  it("returns error when product not found", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

    const result = await updateCartQuantityAction("prod-999", 5);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.toast.title).toBe("Product unavailable");
    }
  });

  it("returns error when product is inactive", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      stock: 10,
      isActive: false,
    });

    const result = await updateCartQuantityAction("prod-1", 5);
    expect(result.success).toBe(false);
  });

  it("returns error when quantity exceeds stock", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      stock: 3,
      isActive: true,
    });

    const result = await updateCartQuantityAction("prod-1", 10);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.toast.title).toBe("Stock limit reached");
      expect(result.toast.description).toContain("3");
    }
  });

  it("updates quantity successfully", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      stock: 10,
      isActive: true,
    });
    vi.mocked(prisma.cartItem.updateMany).mockResolvedValue({ count: 1 });

    const result = await updateCartQuantityAction("prod-1", 5);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.toast.title).toBe("Quantity updated");
    }
    expect(prisma.cartItem.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", productId: "prod-1" },
      data: { quantity: 5 },
    });
  });
});

// ─── removeFromCartAction ────────────────────────────────────────────────────

describe("removeFromCartAction", () => {
  it("returns error when not logged in", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const result = await removeFromCartAction("prod-1");
    expect(result.success).toBe(false);
  });

  it("removes item successfully", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.cartItem.deleteMany).mockResolvedValue({ count: 1 });

    const result = await removeFromCartAction("prod-1");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.toast.title).toBe("Item removed");
    }
    expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", productId: "prod-1" },
    });
  });

  it("succeeds when item does not exist in cart (idempotent)", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.cartItem.deleteMany).mockResolvedValue({ count: 0 });

    const result = await removeFromCartAction("prod-nonexistent");
    expect(result.success).toBe(true);
  });
});
