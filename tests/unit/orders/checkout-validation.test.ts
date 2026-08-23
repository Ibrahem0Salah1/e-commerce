import { describe, it, expect } from "vitest";
import { checkoutSchema, checkoutFormSchema } from "@/lib/validations";

describe("Checkout Validation Schemas", () => {
  const validUUID = "123e4567-e89b-12d3-a456-426614174000";

  it("validates valid Egyptian phone numbers", () => {
    const validPhones = [
      "01012345678",
      "01123456789",
      "01234567890",
      "01555555555",
      "+201012345678",
      "201123456789",
    ];

    for (const phone of validPhones) {
      const result = checkoutFormSchema.safeParse({
        shippingMethodId: "ship_123",
        shippingName: "Dr. Hassan",
        shippingPhone: phone,
        shippingAddress: "El-Tahrir Sq, Cairo",
        shippingCity: "Cairo",
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid Egyptian phone numbers", () => {
    const invalidPhones = [
      "01312345678", // invalid prefix 013
      "0101234567", // only 10 digits
      "010123456789", // 12 digits
      "abc010123456", // non-digits
      "+15551234567", // foreign code
      "+201312345678", // invalid prefix with +20
    ];

    for (const phone of invalidPhones) {
      const result = checkoutFormSchema.safeParse({
        shippingMethodId: "ship_123",
        shippingName: "Dr. Hassan",
        shippingPhone: phone,
        shippingAddress: "El-Tahrir Sq, Cairo",
        shippingCity: "Cairo",
      });
      expect(result.success).toBe(false);
    }
  });

  it("requires shipping address and name to satisfy length requirements", () => {
    const shortName = checkoutFormSchema.safeParse({
      shippingMethodId: "ship_123",
      shippingName: "A", // too short (min 2)
      shippingPhone: "01012345678",
      shippingAddress: "El-Tahrir Sq, Cairo",
      shippingCity: "Cairo",
    });
    expect(shortName.success).toBe(false);

    const shortAddress = checkoutFormSchema.safeParse({
      shippingMethodId: "ship_123",
      shippingName: "Dr. Hassan",
      shippingPhone: "01012345678",
      shippingAddress: "123", // too short (min 5)
      shippingCity: "Cairo",
    });
    expect(shortAddress.success).toBe(false);
  });

  it("validates full checkoutSchema with items and valid UUID idempotencyKey", () => {
    const validPayload = {
      idempotencyKey: validUUID,
      shippingMethodId: "ship_123",
      shippingName: "Dr. Hassan",
      shippingPhone: "01012345678",
      shippingAddress: "123 Clinic St, Cairo",
      shippingCity: "Cairo",
      items: [
        { productId: "prod_1", quantity: 5 },
        { productId: "prod_2", quantity: 10 },
      ],
    };

    const result = checkoutSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID idempotency keys", () => {
    const invalidPayload = {
      idempotencyKey: "not-a-uuid",
      shippingMethodId: "ship_123",
      shippingName: "Dr. Hassan",
      shippingPhone: "01012345678",
      shippingAddress: "123 Clinic St, Cairo",
      shippingCity: "Cairo",
      items: [{ productId: "prod_1", quantity: 1 }],
    };

    const result = checkoutSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });

  it("rejects empty items array and quantities greater than 50", () => {
    const emptyItems = checkoutSchema.safeParse({
      idempotencyKey: validUUID,
      shippingMethodId: "ship_123",
      shippingName: "Dr. Hassan",
      shippingPhone: "01012345678",
      shippingAddress: "123 Clinic St, Cairo",
      shippingCity: "Cairo",
      items: [],
    });
    expect(emptyItems.success).toBe(false);

    const overLimit = checkoutSchema.safeParse({
      idempotencyKey: validUUID,
      shippingMethodId: "ship_123",
      shippingName: "Dr. Hassan",
      shippingPhone: "01012345678",
      shippingAddress: "123 Clinic St, Cairo",
      shippingCity: "Cairo",
      items: [{ productId: "prod_1", quantity: 51 }],
    });
    expect(overLimit.success).toBe(false);
  });
});
