import { describe, it, expect } from "vitest";
import {
  buildWhatsAppLink,
  isWhatsAppMessageTruncated,
  buildOrderWhatsAppMessage,
} from "@/lib/utils/phone";
import type { AdminOrderSummary } from "@/lib/orders/types";

describe("buildWhatsAppLink", () => {
  it("normalizes 010… → 2010…", () => {
    expect(buildWhatsAppLink("01012345678")).toBe("https://wa.me/201012345678");
  });
  it("strips +20 and 00 prefix", () => {
    expect(buildWhatsAppLink("+20 101 234 5678")).toBe("https://wa.me/201012345678");
    expect(buildWhatsAppLink("00201012345678")).toBe("https://wa.me/201012345678");
  });
  it("encodes message", () => {
    expect(buildWhatsAppLink("01012345678", "hello world")).toBe(
      "https://wa.me/201012345678?text=hello%20world",
    );
  });
  it("truncates overly long messages to stay under 4096", () => {
    const long = "A".repeat(5000);
    const url = buildWhatsAppLink("01012345678", long);
    expect(url.length).toBeLessThanOrEqual(4096);
    expect(decodeURIComponent(url)).toContain("[Message truncated");
  });
  it("isWhatsAppMessageTruncated detects long", () => {
    expect(isWhatsAppMessageTruncated("A".repeat(5000))).toBe(true);
    expect(isWhatsAppMessageTruncated("hello")).toBe(false);
  });
});

describe("buildOrderWhatsAppMessage", () => {
  function order(overrides: Partial<AdminOrderSummary> = {}): AdminOrderSummary {
    return {
      id: "ord_12345678abcdef",
      userId: null,
      user: null,
      status: "PENDING",
      paymentStatus: "UNPAID",
      paymentMethod: "COD",
      paidAt: null,
      subtotal: 300,
      discountAmount: 0,
      shippingPrice: 20,
      shippingMethodName: "Standard Delivery",
      total: 320,
      shippingName: "Ahmed Ali",
      shippingPhone: "01012345678",
      shippingAddress: "123 Nile St",
      shippingCity: "Cairo",
      shippingNotes: null,
      itemCount: 2,
      createdAt: new Date("2026-01-15T10:00:00Z").toISOString(),
      cancelledAt: null,
      items: [
        {
          id: "i1",
          productId: "p1",
          productName: "Amalgam Capsule",
          variantName: "Medium",
          unitPrice: 100,
          totalPrice: 200,
          costPriceAtSale: 60,
          quantity: 2,
          product: { images: [], slug: "amalgam" },
        },
      ],
      ...overrides,
    };
  }

  it("includes order ref, items, totals, and hides costPriceAtSale", () => {
    const msg = buildOrderWhatsAppMessage(order());
    expect(msg).toContain("#78ABCDEF"); // ord_12345678abcdef slice(-8) upper
    expect(msg).toContain("Amalgam Capsule");
    expect(msg).toContain("Subtotal");
    expect(msg).toContain("Shipping");
    expect(msg).not.toContain("Cost at sale");
    expect(msg).toContain("Cairo");
  });

  it("handles many items without throwing (truncation via buildWhatsAppLink)", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      id: `i${i}`,
      productId: `p${i}`,
      productName: `Product ${i} with a fairly long name`,
      variantName: "V",
      unitPrice: 100,
      totalPrice: 100,
      costPriceAtSale: 60,
      quantity: 1,
      product: null,
    }));
    const o = order({ items: many as never, itemCount: 20, subtotal: 2000, total: 2020 });
    const msg = buildOrderWhatsAppMessage(o);
    const url = buildWhatsAppLink(o.shippingPhone, msg);
    expect(url.length).toBeLessThanOrEqual(4096);
  });
});
