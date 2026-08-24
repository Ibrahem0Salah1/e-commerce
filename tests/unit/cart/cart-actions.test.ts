import { describe, it, expect, vi, beforeEach } from "vitest";

const { authMock, prismaMock, fetchCartItemsMock } = vi.hoisted(() => ({
  authMock: { api: { getSession: vi.fn() } },
  prismaMock: {
    $transaction: vi.fn(),
    product: { findUnique: vi.fn(), findMany: vi.fn() },
    cartItem: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
  fetchCartItemsMock: vi.fn(),
}));

vi.mock("@/lib/auth/server", () => ({ auth: authMock }));
vi.mock("@/lib/config/prisma", () => ({ default: prismaMock }));
vi.mock("@/lib/cart/queries", () => ({ fetchCartItems: fetchCartItemsMock }));
vi.mock("next/headers", () => ({ headers: () => new Headers() }));

import {
  addToCartAction,
  getCartAction,
  updateCartQuantityAction,
  removeFromCartAction,
  clearCartAction,
  mergeCartAction,
} from "@/lib/cart/actions";

const USER = { id: "u1", name: "Tester", email: "t@example.com" };

function mockSession(user: typeof USER | null) {
  authMock.api.getSession.mockResolvedValue(user ? { user } : null);
}

function mockProduct(overrides: Partial<{ stock: number; isActive: boolean; name: string }> = {}) {
  prismaMock.product.findUnique.mockResolvedValue({
    stock: 10,
    isActive: true,
    name: "E2E Amalgam Capsule",
    ...overrides,
  });
}

function mockProductMany(rows: { id: string; stock: number; isActive: boolean }[]) {
  prismaMock.product.findMany.mockResolvedValue(rows);
}

function mockCartItem(existing: { id: string; userId: string; productId: string; quantity: number } | null) {
  prismaMock.cartItem.findUnique.mockResolvedValue(existing);
}

function mockCartItemsMany(rows: { id: string; productId: string; quantity: number }[]) {
  prismaMock.cartItem.findMany.mockResolvedValue(rows);
}

function mockUpdateManyCount(count: number) {
  prismaMock.cartItem.updateMany.mockResolvedValue({ count });
}

describe("cart server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The interactive transaction passes the same mocked prisma object through
    // as its `tx`, so every `tx.X` call below resolves to the prismaMock mocks.
    prismaMock.$transaction.mockImplementation(async (fn: unknown) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fn as any)(prismaMock),
    );
    mockUpdateManyCount(0);
    mockCartItem(null);
  });

  describe("getCartAction", () => {
    it("returns an empty array when there is no session", async () => {
      mockSession(null);
      expect(await getCartAction()).toEqual([]);
    });

    it("returns the user's cart items when signed in", async () => {
      mockSession(USER);
      fetchCartItemsMock.mockResolvedValue([{ productId: "p1", quantity: 2 }]);
      expect(await getCartAction()).toEqual([{ productId: "p1", quantity: 2 }]);
      expect(fetchCartItemsMock).toHaveBeenCalledWith("u1");
    });
  });

  describe("addToCartAction", () => {
    it("rejects guests", async () => {
      mockSession(null);
      const result = await addToCartAction("p1", 1);
      expect(result.success).toBe(false);
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it("rejects a non-positive quantity", async () => {
      mockSession(USER);
      const result = await addToCartAction("p1", 0);
      expect(result).toMatchObject({ success: false, toast: { title: "Invalid quantity" } });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it("rejects a negative quantity", async () => {
      mockSession(USER);
      const result = await addToCartAction("p1", -3);
      expect(result).toMatchObject({ success: false, toast: { title: "Invalid quantity" } });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it("rejects a non-integer quantity", async () => {
      mockSession(USER);
      const result = await addToCartAction("p1", 1.5);
      expect(result).toMatchObject({ success: false, toast: { title: "Invalid quantity" } });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it("rejects an empty product id", async () => {
      mockSession(USER);
      const result = await addToCartAction("", 1);
      expect(result).toMatchObject({ success: false, toast: { title: "Invalid product" } });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it("rejects an unknown or inactive product", async () => {
      mockSession(USER);
      mockProduct({ isActive: false });
      const result = await addToCartAction("p1", 1);
      expect(result).toMatchObject({ success: false, toast: { title: "Product unavailable" } });
      expect(prismaMock.cartItem.create).not.toHaveBeenCalled();
    });

    it("rejects when the product is out of stock", async () => {
      mockSession(USER);
      mockProduct({ stock: 0 });
      const result = await addToCartAction("p1", 1);
      expect(result).toMatchObject({ success: false, toast: { title: "Out of stock" } });
    });

    it("rejects when the quantity alone exceeds the available stock", async () => {
      mockSession(USER);
      mockProduct({ stock: 5 });
      const result = await addToCartAction("p1", 6);
      expect(result).toMatchObject({ success: false, toast: { title: "Stock limit reached" } });
      expect(prismaMock.cartItem.create).not.toHaveBeenCalled();
      expect(prismaMock.cartItem.updateMany).not.toHaveBeenCalled();
    });

    it("CREATES a new cart row WITH the requested quantity (regression)", async () => {
      mockSession(USER);
      mockProduct({ stock: 10 });
      mockCartItem(null);

      const result = await addToCartAction("p1", 3);

      expect(result.success).toBe(true);
      expect(prismaMock.cartItem.create).toHaveBeenCalledWith({
        data: { userId: "u1", productId: "p1", quantity: 3 },
      });
      expect(prismaMock.cartItem.updateMany).toHaveBeenCalledWith({
        where: { userId: "u1", productId: "p1", quantity: { lte: 7 } },
        data: { quantity: { increment: 3 } },
      });
    });

    it("defaults to quantity 1 when none is passed", async () => {
      mockSession(USER);
      mockProduct({ stock: 10 });
      mockCartItem(null);

      await addToCartAction("p1");

      expect(prismaMock.cartItem.create).toHaveBeenCalledWith({
        data: { userId: "u1", productId: "p1", quantity: 1 },
      });
    });

    it("conditionally increments an existing cart row atomically", async () => {
      mockSession(USER);
      mockProduct({ stock: 10 });
      mockCartItem({ id: "ci1", userId: "u1", productId: "p1", quantity: 2 });
      mockUpdateManyCount(1);

      const result = await addToCartAction("p1", 2);

      expect(result.success).toBe(true);
      expect(prismaMock.cartItem.updateMany).toHaveBeenCalledWith({
        where: { userId: "u1", productId: "p1", quantity: { lte: 8 } },
        data: { quantity: { increment: 2 } },
      });
      expect(prismaMock.cartItem.create).not.toHaveBeenCalled();
    });

    it("rejects when the existing row plus the new quantity exceeds stock", async () => {
      mockSession(USER);
      mockProduct({ stock: 4 });
      mockCartItem({ id: "ci1", userId: "u1", productId: "p1", quantity: 3 });
      mockUpdateManyCount(0);

      const result = await addToCartAction("p1", 2);

      expect(result).toMatchObject({ success: false, toast: { title: "Stock limit reached" } });
      expect(prismaMock.cartItem.create).not.toHaveBeenCalled();
    });
  });

  describe("updateCartQuantityAction", () => {
    it("rejects guests", async () => {
      mockSession(null);
      expect((await updateCartQuantityAction("p1", 2)).success).toBe(false);
    });

    it("rejects a non-integer quantity", async () => {
      mockSession(USER);
      const result = await updateCartQuantityAction("p1", 1.5);
      expect(result).toMatchObject({ success: false, toast: { title: "Invalid quantity" } });
    });

    it("removes the item when quantity is 0", async () => {
      mockSession(USER);
      const result = await updateCartQuantityAction("p1", 0);
      expect(result.success).toBe(true);
      expect(prismaMock.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { userId: "u1", productId: "p1" },
      });
    });

    it("removes the item when quantity is negative", async () => {
      mockSession(USER);
      await updateCartQuantityAction("p1", -3);
      expect(prismaMock.cartItem.deleteMany).toHaveBeenCalled();
    });

    it("rejects when the requested quantity exceeds stock", async () => {
      mockSession(USER);
      mockProduct({ stock: 4 });
      const result = await updateCartQuantityAction("p1", 9);
      expect(result).toMatchObject({ success: false, toast: { title: "Stock limit reached" } });
      expect(prismaMock.cartItem.updateMany).not.toHaveBeenCalled();
    });

    it("updates the quantity for a valid request (atomic cap guard)", async () => {
      mockSession(USER);
      mockProduct({ stock: 10 });
      mockUpdateManyCount(1);
      const result = await updateCartQuantityAction("p1", 7);
      expect(result.success).toBe(true);
      expect(prismaMock.cartItem.updateMany).toHaveBeenCalledWith({
        where: { userId: "u1", productId: "p1", quantity: { lte: 3 } },
        data: { quantity: 7 },
      });
    });

    it("reports a stock limit when a concurrent write invalidated the cap", async () => {
      mockSession(USER);
      mockProduct({ stock: 10 });
      mockUpdateManyCount(0); // atomic guard rejected the write
      mockCartItem({ id: "ci1", userId: "u1", productId: "p1", quantity: 9 });
      const result = await updateCartQuantityAction("p1", 7);
      expect(result).toMatchObject({ success: false, toast: { title: "Stock limit reached" } });
    });

    it("reports an error when the cart row no longer exists", async () => {
      mockSession(USER);
      mockProduct({ stock: 10 });
      mockUpdateManyCount(0);
      mockCartItem(null);
      const result = await updateCartQuantityAction("p1", 7);
      expect(result).toMatchObject({ success: false, toast: { title: "Item not in cart" } });
    });
  });

  describe("removeFromCartAction", () => {
    it("rejects guests", async () => {
      mockSession(null);
      expect((await removeFromCartAction("p1")).success).toBe(false);
    });

    it("deletes the row for the signed-in user", async () => {
      mockSession(USER);
      const result = await removeFromCartAction("p1");
      expect(result.success).toBe(true);
      expect(prismaMock.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { userId: "u1", productId: "p1" },
      });
    });
  });

  describe("clearCartAction", () => {
    it("rejects guests", async () => {
      mockSession(null);
      expect((await clearCartAction()).success).toBe(false);
    });

    it("deletes every row for the signed-in user", async () => {
      mockSession(USER);
      const result = await clearCartAction();
      expect(result.success).toBe(true);
      expect(prismaMock.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { userId: "u1" },
      });
    });
  });

  describe("mergeCartAction", () => {
    it("keeps everything pending when there is no session", async () => {
      mockSession(null);
      const result = await mergeCartAction([
        { productId: "p1", quantity: 2 },
        { productId: "p2", quantity: 1 },
      ]);
      expect(result).toEqual({
        added: [],
        skippedStockFull: [],
        unavailable: [],
        pending: ["p1", "p2"],
      });
    });

    it("returns empty results for an empty item list", async () => {
      mockSession(USER);
      const result = await mergeCartAction([]);
      expect(result).toEqual({ added: [], skippedStockFull: [], unavailable: [], pending: [] });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it("drops non-positive or non-integer quantities defensively", async () => {
      mockSession(USER);
      const result = await mergeCartAction([
        { productId: "p1", quantity: 0 },
        { productId: "p2", quantity: -2 },
        { productId: "p3", quantity: 1.5 },
      ]);
      expect(result).toEqual({ added: [], skippedStockFull: [], unavailable: [], pending: [] });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it("groups duplicate quantities and creates the merged row", async () => {
      mockSession(USER);
      mockProductMany([{ id: "p1", stock: 10, isActive: true }]);
      mockCartItemsMany([]);

      const result = await mergeCartAction([
        { productId: "p1", quantity: 2 },
        { productId: "p1", quantity: 3 },
      ]);

      expect(result.added).toEqual([
        { productId: "p1", quantity: 5, requestedQuantity: 5 },
      ]);
      expect(prismaMock.cartItem.create).toHaveBeenCalledWith({
        data: { userId: "u1", productId: "p1", quantity: 5 },
      });
    });

    it("clamps a new product to available stock and reports the shortfall", async () => {
      mockSession(USER);
      mockProductMany([{ id: "p1", stock: 3, isActive: true }]);
      mockCartItemsMany([]);

      const result = await mergeCartAction([{ productId: "p1", quantity: 4 }]);

      expect(result.added).toEqual([
        { productId: "p1", quantity: 3, requestedQuantity: 4 },
      ]);
      expect(result.skippedStockFull).toEqual([]);
      expect(prismaMock.cartItem.create).toHaveBeenCalledWith({
        data: { userId: "u1", productId: "p1", quantity: 3 },
      });
    });

    it("conditionally increments existing rows within stock", async () => {
      mockSession(USER);
      mockProductMany([{ id: "p1", stock: 10, isActive: true }]);
      mockCartItemsMany([{ id: "ci1", productId: "p1", quantity: 3 }]);
      mockUpdateManyCount(1);

      const result = await mergeCartAction([{ productId: "p1", quantity: 2 }]);

      expect(result.added).toEqual([
        { productId: "p1", quantity: 2, requestedQuantity: 2 },
      ]);
      expect(prismaMock.cartItem.updateMany).toHaveBeenCalledWith({
        where: { userId: "u1", productId: "p1", quantity: { lte: 3 } },
        data: { quantity: { increment: 2 } },
      });
      expect(prismaMock.cartItem.create).not.toHaveBeenCalled();
    });

    it("clamps an existing row that would overflow stock (partial delta)", async () => {
      mockSession(USER);
      mockProductMany([{ id: "p1", stock: 5, isActive: true }]);
      mockCartItemsMany([{ id: "ci1", productId: "p1", quantity: 4 }]);
      // target = min(5, 4+2) = 5, delta = 1
      prismaMock.cartItem.updateMany.mockResolvedValue({ count: 1 });

      const result = await mergeCartAction([{ productId: "p1", quantity: 2 }]);

      expect(result.added).toEqual([
        { productId: "p1", quantity: 1, requestedQuantity: 2 },
      ]);
      expect(prismaMock.cartItem.updateMany).toHaveBeenCalledWith({
        where: { userId: "u1", productId: "p1", quantity: { lte: 4 } },
        data: { quantity: { increment: 1 } },
      });
    });

    it("marks an already-maxed row as skippedStockFull (nothing fits)", async () => {
      mockSession(USER);
      mockProductMany([{ id: "p1", stock: 5, isActive: true }]);
      mockCartItemsMany([{ id: "ci1", productId: "p1", quantity: 5 }]);
      // target = min(5, 6) = 5, delta = 0

      const result = await mergeCartAction([{ productId: "p1", quantity: 1 }]);

      expect(result.added).toEqual([]);
      expect(result.skippedStockFull).toEqual(["p1"]);
      expect(prismaMock.cartItem.create).not.toHaveBeenCalled();
      expect(prismaMock.cartItem.updateMany).not.toHaveBeenCalled();
    });

    it("classifies deleted / inactive / zero-stock products as unavailable", async () => {
      mockSession(USER);
      // NOTE: `ghost` is intentionally ABSENT below — deleted products never
      // come back from the `id in [...]` query.
      mockProductMany([
        { id: "p_inactive", stock: 10, isActive: false },
        { id: "p_nostock", stock: 0, isActive: true },
      ]);
      mockCartItemsMany([]);

      const result = await mergeCartAction([
        { productId: "ghost", quantity: 1 },
        { productId: "p_inactive", quantity: 1 },
        { productId: "p_nostock", quantity: 1 },
      ]);

      expect(result.unavailable.sort()).toEqual(["ghost", "p_inactive", "p_nostock"]);
      expect(result.added).toEqual([]);
    });

    it("reports a mix of added / stock-full / unavailable", async () => {
      mockSession(USER);
      mockProductMany([
        { id: "p1", stock: 10, isActive: true },
        { id: "p2", stock: 2, isActive: true },
        { id: "p3", stock: 0, isActive: true },
      ]);
      mockCartItemsMany([]);

      const result = await mergeCartAction([
        { productId: "p1", quantity: 1 },
        { productId: "p2", quantity: 5 },
        { productId: "p3", quantity: 1 },
      ]);

      expect(result.added).toEqual([
        { productId: "p1", quantity: 1, requestedQuantity: 1 },
        { productId: "p2", quantity: 2, requestedQuantity: 5 },
      ]);
      expect(result.skippedStockFull).toEqual([]);
      expect(result.unavailable).toEqual(["p3"]);
    });

    it("re-reads and applies the best remaining delta when the row shifted mid-tx", async () => {
      mockSession(USER);
      mockProductMany([{ id: "p1", stock: 10, isActive: true }]);
      mockCartItemsMany([{ id: "ci1", productId: "p1", quantity: 3 }]);
      // conditional increment loses the race...
      prismaMock.cartItem.updateMany.mockResolvedValue({ count: 0 });
      // ...fresh read shows another writer already pushed it to 8...
      mockCartItem({ id: "ci1", userId: "u1", productId: "p1", quantity: 8 });
      // ...so only 2 more units fit (target min(10, 8+2)=10).
      prismaMock.cartItem.update.mockResolvedValue({});

      const result = await mergeCartAction([{ productId: "p1", quantity: 2 }]);

      expect(result.added).toEqual([
        { productId: "p1", quantity: 2, requestedQuantity: 2 },
      ]);
      expect(prismaMock.cartItem.update).toHaveBeenCalledWith({
        where: { userId_productId: { userId: "u1", productId: "p1" } },
        data: { quantity: { increment: 2 } },
      });
    });

    it("skips when even the re-read leaves no room (row raced past the cap)", async () => {
      mockSession(USER);
      mockProductMany([{ id: "p1", stock: 5, isActive: true }]);
      mockCartItemsMany([{ id: "ci1", productId: "p1", quantity: 4 }]);
      prismaMock.cartItem.updateMany.mockResolvedValue({ count: 0 });
      mockCartItem({ id: "ci1", userId: "u1", productId: "p1", quantity: 9 });

      const result = await mergeCartAction([{ productId: "p1", quantity: 2 }]);

      expect(result.skippedStockFull).toEqual(["p1"]);
      expect(result.added).toEqual([]);
      expect(prismaMock.cartItem.update).not.toHaveBeenCalled();
    });

    it("keeps everything pending when the transaction fails unexpectedly", async () => {
      mockSession(USER);
      prismaMock.$transaction.mockRejectedValue(new Error("db down"));

      const result = await mergeCartAction([
        { productId: "p1", quantity: 1 },
        { productId: "p2", quantity: 2 },
      ]);

      expect(result.pending).toEqual(["p1", "p2"]);
      expect(result.added).toEqual([]);
    });
  });
});
