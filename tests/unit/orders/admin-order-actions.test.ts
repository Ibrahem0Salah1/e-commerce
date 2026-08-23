import { describe, it, expect, vi, beforeEach } from "vitest";

const { authMock, prismaMock, ratelimitMock } = vi.hoisted(() => ({
  authMock: { api: { getSession: vi.fn() } },
  prismaMock: {
    $transaction: vi.fn(),
    order: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    product: { update: vi.fn() },
  },
  ratelimitMock: {
    checkoutRatelimit: { limit: vi.fn().mockResolvedValue({ success: true }) },
    checkoutIpRatelimit: { limit: vi.fn().mockResolvedValue({ success: true }) },
    getClientIP: vi.fn().mockResolvedValue("127.0.0.1"),
  },
}));

vi.mock("@/lib/auth/server", () => ({ auth: authMock }));
vi.mock("@/lib/config/prisma", () => ({ default: prismaMock }));
vi.mock("@/lib/ratelimit", () => ({ ...ratelimitMock }));
vi.mock("next/headers", () => ({ headers: () => new Headers() }));

import {
  adminCancelOrderAction,
  adminMarkOrderPaidAction,
  adminUpdateOrderStatusAction,
} from "@/lib/orders/actions";

const ADMIN_USER = {
  id: "admin_1",
  name: "Admin User",
  email: "admin@mds.com",
  role: "ADMIN",
};

describe("Admin Order Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    prismaMock.$transaction.mockImplementation(async (fn: unknown) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fn as any)(prismaMock),
    );

    authMock.api.getSession.mockResolvedValue({ user: ADMIN_USER });
  });

  describe("adminCancelOrderAction", () => {
    it("claims the cancellation then reverses stock exactly once", async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: "ord_1",
        status: "CONFIRMED",
        items: [
          { productId: "prod_a", quantity: 3 },
          { productId: "prod_b", quantity: 2 },
        ],
      });
      // Claim wins
      prismaMock.order.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.order.findUniqueOrThrow.mockResolvedValue({
        id: "ord_1",
        status: "CANCELLED",
      });

      const result = await adminCancelOrderAction({ orderId: "ord_1" });
      expect(result.success).toBe(true);

      // Claim-first: conditional atomic flip
      expect(prismaMock.order.updateMany).toHaveBeenCalledWith({
        where: {
          id: "ord_1",
          status: { in: ["PENDING", "CONFIRMED", "SHIPPED"] },
        },
        data: expect.objectContaining({ status: "CANCELLED" }),
      });

      // Act-second: stock restored only after winning the claim
      expect(prismaMock.product.update).toHaveBeenCalledWith({
        where: { id: "prod_a" },
        data: { stock: { increment: 3 } },
      });
      expect(prismaMock.product.update).toHaveBeenCalledWith({
        where: { id: "prod_b" },
        data: { stock: { increment: 2 } },
      });
    });

    it("never touches stock when it loses the cancellation race", async () => {
      // First read: looks cancellable...
      prismaMock.order.findUnique
        .mockResolvedValueOnce({
          id: "ord_1",
          status: "CONFIRMED",
          items: [{ productId: "prod_a", quantity: 3 }],
        })
        // ...but the re-read after losing the claim shows another caller won.
        .mockResolvedValueOnce({ status: "CANCELLED" });
      prismaMock.order.updateMany.mockResolvedValue({ count: 0 });

      const result = await adminCancelOrderAction({ orderId: "ord_1" });

      expect(result.success).toBe(true);
      expect(prismaMock.product.update).not.toHaveBeenCalled();
    });

    it("acts as a no-op if order is already CANCELLED", async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: "ord_1",
        status: "CANCELLED",
        items: [{ productId: "prod_a", quantity: 3 }],
      });

      const result = await adminCancelOrderAction({ orderId: "ord_1" });
      expect(result.success).toBe(true);
      expect(prismaMock.product.update).not.toHaveBeenCalled();
      expect(prismaMock.order.updateMany).not.toHaveBeenCalled();
    });

    it("rejects cancelling an order that is already DELIVERED", async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: "ord_1",
        status: "DELIVERED",
        items: [{ productId: "prod_a", quantity: 3 }],
      });

      const result = await adminCancelOrderAction({ orderId: "ord_1" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("delivered");
      }
      expect(prismaMock.order.updateMany).not.toHaveBeenCalled();
      expect(prismaMock.product.update).not.toHaveBeenCalled();
    });

    it("returns a sanitized error when the transaction fails unexpectedly", async () => {
      prismaMock.order.findUnique.mockRejectedValue(
        new Error("ECONNREFUSED 10.0.0.5:5432"),
      );

      const result = await adminCancelOrderAction({ orderId: "ord_1" });
      expect(result.success).toBe(false);
      if (!result.success) {
        // Internal details must never leak to the client
        expect(result.error).not.toContain("10.0.0.5");
        expect(result.error).not.toContain("ECONNREFUSED");
      }
    });
  });

  describe("adminUpdateOrderStatusAction", () => {
    it("allows legal transition PENDING -> CONFIRMED", async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: "ord_1",
        status: "PENDING",
        items: [],
      });
      prismaMock.order.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.order.findUniqueOrThrow.mockResolvedValue({
        id: "ord_1",
        status: "CONFIRMED",
      });

      const result = await adminUpdateOrderStatusAction({
        orderId: "ord_1",
        newStatus: "CONFIRMED",
      });

      expect(result.success).toBe(true);
      expect(prismaMock.order.updateMany).toHaveBeenCalledWith({
        where: { id: "ord_1", status: "PENDING" },
        data: { status: "CONFIRMED" },
      });
    });

    it("rejects conflicting concurrent transitions", async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: "ord_1",
        status: "PENDING",
        items: [],
      });
      prismaMock.order.updateMany.mockResolvedValue({ count: 0 });

      const result = await adminUpdateOrderStatusAction({
        orderId: "ord_1",
        newStatus: "CONFIRMED",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("changed while saving");
      }
    });

    it("disallows illegal transition PENDING -> DELIVERED", async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: "ord_1",
        status: "PENDING",
        items: [],
      });

      const result = await adminUpdateOrderStatusAction({
        orderId: "ord_1",
        newStatus: "DELIVERED",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Cannot move");
      }
      expect(prismaMock.order.updateMany).not.toHaveBeenCalled();
    });

    it("automatically restores stock when transitioning to CANCELLED", async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        id: "ord_1",
        status: "CONFIRMED",
        items: [{ productId: "prod_1", quantity: 5 }],
      });
      prismaMock.order.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.order.findUniqueOrThrow.mockResolvedValue({
        id: "ord_1",
        status: "CANCELLED",
      });

      const result = await adminUpdateOrderStatusAction({
        orderId: "ord_1",
        newStatus: "CANCELLED",
      });

      expect(result.success).toBe(true);
      expect(prismaMock.product.update).toHaveBeenCalledWith({
        where: { id: "prod_1" },
        data: { stock: { increment: 5 } },
      });
    });

    it("does not restore stock when losing the CANCELLED race", async () => {
      prismaMock.order.findUnique
        .mockResolvedValueOnce({
          id: "ord_1",
          status: "CONFIRMED",
          items: [{ productId: "prod_1", quantity: 5 }],
        })
        .mockResolvedValueOnce({ status: "CANCELLED" });
      prismaMock.order.updateMany.mockResolvedValue({ count: 0 });

      const result = await adminUpdateOrderStatusAction({
        orderId: "ord_1",
        newStatus: "CANCELLED",
      });

      expect(result.success).toBe(false);
      expect(prismaMock.product.update).not.toHaveBeenCalled();
    });
  });

  describe("adminMarkOrderPaidAction", () => {
    it("marks an unpaid order as PAID with timestamp", async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        paymentStatus: "UNPAID",
      });
      prismaMock.order.update.mockResolvedValue({
        id: "ord_1",
        paymentStatus: "PAID",
      });

      const result = await adminMarkOrderPaidAction({ orderId: "ord_1" });
      expect(result.success).toBe(true);
      expect(prismaMock.order.update).toHaveBeenCalledWith({
        where: { id: "ord_1" },
        data: expect.objectContaining({
          paymentStatus: "PAID",
          paidAt: expect.any(Date),
        }),
      });
    });

    it("is idempotent when the order is already PAID", async () => {
      prismaMock.order.findUnique.mockResolvedValue({
        paymentStatus: "PAID",
      });
      prismaMock.order.findUniqueOrThrow.mockResolvedValue({
        id: "ord_1",
        paymentStatus: "PAID",
        paidAt: new Date("2026-01-01T00:00:00Z"),
      });

      const result = await adminMarkOrderPaidAction({ orderId: "ord_1" });

      expect(result.success).toBe(true);
      // Must not overwrite the original paidAt
      expect(prismaMock.order.update).not.toHaveBeenCalled();
    });

    it("returns a friendly error for unknown orders", async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);

      const result = await adminMarkOrderPaidAction({ orderId: "missing" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
      }
    });
  });
});
