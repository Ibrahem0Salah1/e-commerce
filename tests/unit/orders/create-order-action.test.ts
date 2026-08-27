import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

const { authMock, prismaMock, ratelimitMock } = vi.hoisted(() => ({
  authMock: { api: { getSession: vi.fn() } },
  prismaMock: {
    $transaction: vi.fn(),
    product: { findUnique: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() },
    shippingMethod: { findUnique: vi.fn() },
    coupon: { findUnique: vi.fn(), update: vi.fn() },
    order: { findUnique: vi.fn(), create: vi.fn() },
    cartItem: { deleteMany: vi.fn() },
  },
  ratelimitMock: {
    limit: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock("@/lib/auth/server", () => ({ auth: authMock }));
vi.mock("@/lib/config/prisma", () => ({ default: prismaMock }));
vi.mock("@/lib/ratelimit", () => ({ checkoutRatelimit: ratelimitMock }));
vi.mock("next/headers", () => ({ headers: () => new Headers() }));

import { createOrder } from "@/lib/orders/actions";

const TEST_USER = {
  id: "usr_123",
  name: "Dr. Hassan",
  email: "hassan@clinic.com",
  role: "USER",
  banned: false,
  status: "ACTIVE",
};

const VALID_IDEMPOTENCY_KEY = "123e4567-e89b-12d3-a456-426614174000";

describe("createOrder Action", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default $transaction passthrough
    prismaMock.$transaction.mockImplementation(async (fn: unknown) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fn as any)(prismaMock),
    );

    authMock.api.getSession.mockResolvedValue({ user: TEST_USER });
    ratelimitMock.limit.mockResolvedValue({ success: true });
    prismaMock.order.findUnique.mockResolvedValue(null);
  });

  it("rejects unauthenticated requests", async () => {
    authMock.api.getSession.mockResolvedValue(null);

    const result = await createOrder({
      idempotencyKey: VALID_IDEMPOTENCY_KEY,
      shippingMethodId: "ship_1",
      shippingName: "Dr. Hassan",
      shippingPhone: "01012345678",
      shippingAddress: "123 Clinic St",
      shippingCity: "Cairo",
      items: [{ productId: "prod_1", quantity: 1 }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("AUTH");
    }
  });

  it("rejects suspended/banned users", async () => {
    authMock.api.getSession.mockResolvedValue({
      user: { ...TEST_USER, banned: true },
    });

    const result = await createOrder({
      idempotencyKey: VALID_IDEMPOTENCY_KEY,
      shippingMethodId: "ship_1",
      shippingName: "Dr. Hassan",
      shippingPhone: "01012345678",
      shippingAddress: "123 Clinic St",
      shippingCity: "Cairo",
      items: [{ productId: "prod_1", quantity: 1 }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("FORBIDDEN");
    }
  });

  it("returns existing order when idempotencyKey was already submitted by same user", async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      id: "ord_999",
      userId: TEST_USER.id,
      status: "PENDING",
      total: new Prisma.Decimal(250),
    });

    const result = await createOrder({
      idempotencyKey: VALID_IDEMPOTENCY_KEY,
      shippingMethodId: "ship_1",
      shippingName: "Dr. Hassan",
      shippingPhone: "01012345678",
      shippingAddress: "123 Clinic St",
      shippingCity: "Cairo",
      items: [{ productId: "prod_1", quantity: 1 }],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.orderId).toBe("ord_999");
      expect(result.alreadyExisted).toBe(true);
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    }
  });

  it("rejects idempotency key belonging to a different user", async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      id: "ord_888",
      userId: "different_user",
      status: "PENDING",
      total: new Prisma.Decimal(250),
    });

    const result = await createOrder({
      idempotencyKey: VALID_IDEMPOTENCY_KEY,
      shippingMethodId: "ship_1",
      shippingName: "Dr. Hassan",
      shippingPhone: "01012345678",
      shippingAddress: "123 Clinic St",
      shippingCity: "Cairo",
      items: [{ productId: "prod_1", quantity: 1 }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("VALIDATION");
    }
  });

  it("merges duplicate productIds and succeeds with atomic stock decrement", async () => {
    prismaMock.shippingMethod.findUnique.mockResolvedValue({
      id: "ship_1",
      name: "Cairo Delivery",
      price: new Prisma.Decimal(50),
      isActive: true,
    });

    prismaMock.product.findMany.mockResolvedValue([
      {
        id: "prod_1",
        name: "Composite Resin A2",
        price: new Prisma.Decimal(100),
        costPrice: new Prisma.Decimal(60),
        stock: 20,
        isActive: true,
        archived: false,
      },
    ]);

    prismaMock.product.updateMany.mockResolvedValue({ count: 1 });

    prismaMock.order.create.mockResolvedValue({
      id: "ord_100",
      status: "PENDING",
      total: new Prisma.Decimal(250), // (2 * 100) + 50 shipping
    });

    const result = await createOrder({
      idempotencyKey: VALID_IDEMPOTENCY_KEY,
      shippingMethodId: "ship_1",
      shippingName: "Dr. Hassan",
      shippingPhone: "01012345678",
      shippingAddress: "123 Clinic St",
      shippingCity: "Cairo",
      // Duplicate product entries
      items: [
        { productId: "prod_1", quantity: 1 },
        { productId: "prod_1", quantity: 1 },
      ],
    });

    expect(result.success).toBe(true);
    // Verified atomic update was called with merged quantity = 2
    expect(prismaMock.product.updateMany).toHaveBeenCalledWith({
      where: {
        id: "prod_1",
        stock: { gte: 2 },
      },
      data: {
        stock: { decrement: 2 },
      },
    });
  });

  it("fails with OUT_OF_STOCK error if atomic update returns count = 0", async () => {
    prismaMock.shippingMethod.findUnique.mockResolvedValue({
      id: "ship_1",
      name: "Cairo Delivery",
      price: new Prisma.Decimal(50),
      isActive: true,
    });

    prismaMock.product.findMany.mockResolvedValue([
      {
        id: "prod_1",
        name: "Dental Diamond Bur",
        price: new Prisma.Decimal(100),
        stock: 1,
        isActive: true,
        archived: false,
      },
    ]);

    // Atomic update fails (race condition or insufficient stock)
    prismaMock.product.updateMany.mockResolvedValue({ count: 0 });

    const result = await createOrder({
      idempotencyKey: VALID_IDEMPOTENCY_KEY,
      shippingMethodId: "ship_1",
      shippingName: "Dr. Hassan",
      shippingPhone: "01012345678",
      shippingAddress: "123 Clinic St",
      shippingCity: "Cairo",
      items: [{ productId: "prod_1", quantity: 5 }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("OUT_OF_STOCK");
      expect(result.error).toContain("Insufficient stock");
    }
  });
});
