import { OrderStatus, PaymentStatus, PaymentMethod } from "@prisma/client";

export type OrderErrorCode =
  | "AUTH"
  | "VALIDATION"
  | "OUT_OF_STOCK"
  | "INVALID_ITEM"
  | "DUPLICATE"
  | "SHIPPING_INVALID"
  | "RATE_LIMITED"
  | "FORBIDDEN"
  | "SERVER_ERROR";

export class OrderError extends Error {
  constructor(
    message: string,
    public code: OrderErrorCode,
    public details?: unknown,
  ) {
    super(message);
    this.name = "OrderError";
  }
}

/**
 * Sanitized classification for unexpected server failures. Flows through the
 * gated load-test route so k6 runs self-report their failure mix without
 * needing server logs. Never contains internal details.
 */
export type OrderFailureReason = "TX_CONFLICT" | "DB_CONNECTION" | "UNKNOWN";

export type CreateOrderResult =
  | {
      success: true;
      orderId: string;
      status: OrderStatus;
      total: number;
      alreadyExisted: boolean;
    }
  | {
      success: false;
      error: string;
      code: OrderErrorCode;
      details?: unknown;
      reason?: OrderFailureReason;
    };

export type ShippingMethodOption = {
  id: string;
  name: string;
  price: number;
  sortOrder: number;
  isActive: boolean;
};

export type OrderItemDetail = {
  id: string;
  productId: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  totalPrice: number;
  costPriceAtSale: number | null;
  quantity: number;
  product?: {
    images: string[];
    slug: string;
  } | null;
};

export type CustomerOrderSummary = {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  discountAmount: number;
  shippingPrice: number;
  total: number;
  itemCount: number;
  createdAt: string;
  shippingCity: string;
  items: OrderItemDetail[];
};

export type AdminOrderSummary = {
  id: string;
  userId: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  } | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paidAt: string | null;
  subtotal: number;
  discountAmount: number;
  shippingPrice: number;
  shippingMethodName: string | null;
  total: number;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingNotes: string | null;
  itemCount: number;
  createdAt: string;
  cancelledAt: string | null;
  items: OrderItemDetail[];
};

export type AdminOrderMetrics = {
  total: number;
  pending: number;
  confirmed: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  totalRevenue: number;
};

export type AdminOrdersPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminOrdersResult = {
  orders: AdminOrderSummary[];
  pagination: AdminOrdersPagination;
};
