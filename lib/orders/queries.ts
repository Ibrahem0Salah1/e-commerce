import prisma from "@/lib/config/prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import type {
  ShippingMethodOption,
  CustomerOrderSummary,
  AdminOrderSummary,
  AdminOrderMetrics,
  AdminOrdersResult,
} from "./types";

export async function getShippingMethods(): Promise<ShippingMethodOption[]> {
  const methods = await prisma.shippingMethod.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return methods.map((m) => ({
    id: m.id,
    name: m.name,
    price: Number(m.price),
    sortOrder: m.sortOrder,
    isActive: m.isActive,
  }));
}

export async function getCustomerOrders(
  userId: string,
): Promise<CustomerOrderSummary[]> {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: {
            select: { images: true, slug: true },
          },
        },
      },
    },
  });

  return orders.map((o) => ({
    id: o.id,
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    subtotal: Number(o.subtotal),
    discountAmount: Number(o.discountAmount),
    shippingPrice: Number(o.shippingPrice),
    total: Number(o.total),
    itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
    createdAt: o.createdAt.toISOString(),
    shippingCity: o.shippingCity,
    items: o.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      variantName: i.variantName,
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
      costPriceAtSale: i.costPriceAtSale ? Number(i.costPriceAtSale) : null,
      quantity: i.quantity,
      product: i.product
        ? {
            images: i.product.images,
            slug: i.product.slug,
          }
        : null,
    })),
  }));
}

export async function getCustomerOrderDetail(
  userId: string,
  orderId: string,
): Promise<CustomerOrderSummary | null> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: {
        include: {
          product: {
            select: { images: true, slug: true },
          },
        },
      },
    },
  });

  if (!order) return null;

  return {
    id: order.id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount),
    shippingPrice: Number(order.shippingPrice),
    total: Number(order.total),
    itemCount: order.items.reduce((sum, i) => sum + i.quantity, 0),
    createdAt: order.createdAt.toISOString(),
    shippingCity: order.shippingCity,
    items: order.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      variantName: i.variantName,
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
      costPriceAtSale: i.costPriceAtSale ? Number(i.costPriceAtSale) : null,
      quantity: i.quantity,
      product: i.product
        ? {
            images: i.product.images,
            slug: i.product.slug,
          }
        : null,
    })),
  };
}

export type AdminOrdersQueryInput = {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  shippingMethodId?: string;
  search?: string;
};

export async function getAdminOrders(
  params: AdminOrdersQueryInput,
): Promise<AdminOrdersResult> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: import("@prisma/client").Prisma.OrderWhereInput = {};

  if (params.status) {
    where.status = params.status;
  }
  if (params.paymentStatus) {
    where.paymentStatus = params.paymentStatus;
  }
  if (params.shippingMethodId) {
    where.shippingMethodId = params.shippingMethodId;
  }
  if (params.search && params.search.trim()) {
    const q = params.search.trim();
    where.OR = [
      { id: { contains: q, mode: "insensitive" } },
      { shippingName: { contains: q, mode: "insensitive" } },
      { shippingPhone: { contains: q, mode: "insensitive" } },
      { shippingCity: { contains: q, mode: "insensitive" } },
      { user: { name: { contains: q, mode: "insensitive" } } },
      { user: { email: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        shippingMethod: {
          select: { name: true },
        },
        items: {
          include: {
            product: {
              select: { images: true, slug: true },
            },
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  const summaries: AdminOrderSummary[] = orders.map((o) => ({
    id: o.id,
    userId: o.userId,
    user: o.user,
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    paidAt: o.paidAt ? o.paidAt.toISOString() : null,
    subtotal: Number(o.subtotal),
    discountAmount: Number(o.discountAmount),
    shippingPrice: Number(o.shippingPrice),
    shippingMethodName: o.shippingMethod?.name ?? null,
    total: Number(o.total),
    shippingName: o.shippingName,
    shippingPhone: o.shippingPhone,
    shippingAddress: o.shippingAddress,
    shippingCity: o.shippingCity,
    shippingNotes: o.shippingNotes,
    itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
    createdAt: o.createdAt.toISOString(),
    cancelledAt: o.cancelledAt ? o.cancelledAt.toISOString() : null,
    items: o.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      variantName: i.variantName,
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
      costPriceAtSale: i.costPriceAtSale ? Number(i.costPriceAtSale) : null,
      quantity: i.quantity,
      product: i.product
        ? {
            images: i.product.images,
            slug: i.product.slug,
          }
        : null,
    })),
  }));

  return {
    orders: summaries,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAdminOrderDetail(
  orderId: string,
): Promise<AdminOrderSummary | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
      shippingMethod: {
        select: { name: true },
      },
      items: {
        include: {
          product: {
            select: { images: true, slug: true },
          },
        },
      },
    },
  });

  if (!order) return null;

  return {
    id: order.id,
    userId: order.userId,
    user: order.user,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    paidAt: order.paidAt ? order.paidAt.toISOString() : null,
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount),
    shippingPrice: Number(order.shippingPrice),
    shippingMethodName: order.shippingMethod?.name ?? null,
    total: Number(order.total),
    shippingName: order.shippingName,
    shippingPhone: order.shippingPhone,
    shippingAddress: order.shippingAddress,
    shippingCity: order.shippingCity,
    shippingNotes: order.shippingNotes,
    itemCount: order.items.reduce((sum, i) => sum + i.quantity, 0),
    createdAt: order.createdAt.toISOString(),
    cancelledAt: order.cancelledAt ? order.cancelledAt.toISOString() : null,
    items: order.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      variantName: i.variantName,
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
      costPriceAtSale: i.costPriceAtSale ? Number(i.costPriceAtSale) : null,
      quantity: i.quantity,
      product: i.product
        ? {
            images: i.product.images,
            slug: i.product.slug,
          }
        : null,
    })),
  };
}

export async function getAdminOrderMetrics(): Promise<AdminOrderMetrics> {
  const [statusGroups, paidOrders] = await Promise.all([
    // Single grouped count instead of one COUNT per status
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { total: true },
    }),
  ]);

  const countByStatus = new Map(
    statusGroups.map((group) => [group.status, group._count._all]),
  );

  // Every order has exactly one enum status, so summing the groups == total.
  let totalCount = 0;
  for (const count of countByStatus.values()) totalCount += count;

  return {
    total: totalCount,
    pending: countByStatus.get("PENDING") ?? 0,
    confirmed: countByStatus.get("CONFIRMED") ?? 0,
    shipped: countByStatus.get("SHIPPED") ?? 0,
    delivered: countByStatus.get("DELIVERED") ?? 0,
    cancelled: countByStatus.get("CANCELLED") ?? 0,
    totalRevenue: Number(paidOrders._sum.total ?? 0),
  };
}
