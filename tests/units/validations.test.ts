import { describe, it, expect } from "vitest";
import {
  signUpSchema,
  signInSchema,
  otpSchema,
  filtersSchema,
  checkoutSchema,
  addProductSchema,
  updateProductSchema,
  createPurchaseInvoiceSchema,
  purchaseInvoiceLineSchema,
} from "@/lib/validations";

// ─── signUpSchema ────────────────────────────────────────────────────────────

describe("signUpSchema", () => {
  const valid = {
    name: "John Doe",
    email: "john@example.com",
    password: "Strong1Pass",
  };

  it("accepts valid input", () => {
    expect(signUpSchema.parse(valid)).toEqual(valid);
  });

  it("rejects short name (< 3 chars)", () => {
    const result = signUpSchema.safeParse({ ...valid, name: "Jo" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("at least 3 characters");
    }
  });

  it("rejects invalid email", () => {
    const result = signUpSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects short password (< 8 chars)", () => {
    const result = signUpSchema.safeParse({ ...valid, password: "Ab1" });
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase", () => {
    const result = signUpSchema.safeParse({ ...valid, password: "strong1pass" });
    expect(result.success).toBe(false);
  });

  it("rejects password without number", () => {
    const result = signUpSchema.safeParse({
      ...valid,
      password: "StrongPass",
    });
    expect(result.success).toBe(false);
  });
});

// ─── signInSchema ────────────────────────────────────────────────────────────

describe("signInSchema", () => {
  it("accepts valid input", () => {
    expect(
      signInSchema.parse({ email: "a@b.com", password: "secret" })
    ).toEqual({ email: "a@b.com", password: "secret" });
  });

  it("rejects invalid email", () => {
    expect(signInSchema.safeParse({ email: "bad", password: "x" }).success).toBe(
      false
    );
  });

  it("rejects empty password", () => {
    expect(
      signInSchema.safeParse({ email: "a@b.com", password: "" }).success
    ).toBe(false);
  });
});

// ─── otpSchema ───────────────────────────────────────────────────────────────

describe("otpSchema", () => {
  it("accepts 6 digits", () => {
    expect(otpSchema.parse({ otp: "123456" })).toEqual({ otp: "123456" });
  });

  it("rejects non-numeric code", () => {
    expect(otpSchema.safeParse({ otp: "abcdef" }).success).toBe(false);
  });

  it("rejects code shorter than 6 digits", () => {
    expect(otpSchema.safeParse({ otp: "12345" }).success).toBe(false);
  });

  it("rejects code longer than 6 digits", () => {
    expect(otpSchema.safeParse({ otp: "1234567" }).success).toBe(false);
  });
});

// ─── filtersSchema ───────────────────────────────────────────────────────────

describe("filtersSchema", () => {
  it("applies defaults for empty input", () => {
    const result = filtersSchema.parse({});
    expect(result).toEqual({
      category: "",
      family: "",
      brand: "",
      featured: false,
      sort: "name",
      q: "",
    });
  });

  it("accepts valid sort values", () => {
    expect(filtersSchema.parse({ sort: "price_asc" }).sort).toBe("price_asc");
    expect(filtersSchema.parse({ sort: "price_desc" }).sort).toBe("price_desc");
    expect(filtersSchema.parse({ sort: "name" }).sort).toBe("name");
  });

  it("rejects invalid sort value", () => {
    expect(
      filtersSchema.safeParse({ sort: "rating" }).success
    ).toBe(false);
  });
});

// ─── checkoutSchema ──────────────────────────────────────────────────────────

describe("checkoutSchema", () => {
  const valid = {
    idempotencyKey: "abc-123",
    items: [{ productId: "clxyz1234567890abcdefg", quantity: 2 }],
    shippingName: "John Doe",
    shippingPhone: "+20123456789",
    shippingAddress: "123 Main St, Cairo",
    shippingCity: "Cairo",
  };

  it("accepts valid checkout data", () => {
    const result = checkoutSchema.parse(valid);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].quantity).toBe(2);
  });

  it("accepts optional guest fields", () => {
    const result = checkoutSchema.parse({
      ...valid,
      guestEmail: "guest@example.com",
      guestName: "Guest User",
    });
    expect(result.guestEmail).toBe("guest@example.com");
  });

  it("rejects empty idempotency key", () => {
    expect(
      checkoutSchema.safeParse({ ...valid, idempotencyKey: "" }).success
    ).toBe(false);
  });

  it("rejects empty cart", () => {
    expect(
      checkoutSchema.safeParse({ ...valid, items: [] }).success
    ).toBe(false);
  });

  it("rejects quantity below 1", () => {
    expect(
      checkoutSchema.safeParse({
        ...valid,
        items: [{ productId: "clxyz1234567890abcdefg", quantity: 0 }],
      }).success
    ).toBe(false);
  });

  it("rejects quantity above 100", () => {
    expect(
      checkoutSchema.safeParse({
        ...valid,
        items: [{ productId: "clxyz1234567890abcdefg", quantity: 101 }],
      }).success
    ).toBe(false);
  });

  it("rejects shipping name < 2 chars", () => {
    expect(
      checkoutSchema.safeParse({ ...valid, shippingName: "J" }).success
    ).toBe(false);
  });

  it("rejects shipping phone < 8 chars", () => {
    expect(
      checkoutSchema.safeParse({ ...valid, shippingPhone: "123" }).success
    ).toBe(false);
  });

  it("rejects shipping address < 5 chars", () => {
    expect(
      checkoutSchema.safeParse({ ...valid, shippingAddress: "abc" }).success
    ).toBe(false);
  });

  it("accepts multiple items in cart", () => {
    const result = checkoutSchema.parse({
      ...valid,
      items: [
        { productId: "clxyz1234567890abcdefg", quantity: 1 },
        { productId: "clyza9876543210fedcbahg", quantity: 3 },
      ],
    });
    expect(result.items).toHaveLength(2);
  });

  it("accepts valid guest email and name", () => {
    const result = checkoutSchema.parse({
      ...valid,
      guestEmail: "guest@example.com",
      guestName: "Guest User",
    });
    expect(result.guestEmail).toBe("guest@example.com");
    expect(result.guestName).toBe("Guest User");
  });

  it("rejects invalid guest email format", () => {
    expect(
      checkoutSchema.safeParse({
        ...valid,
        guestEmail: "not-an-email",
      }).success
    ).toBe(false);
  });
});

// ─── addProductSchema ────────────────────────────────────────────────────────

describe("addProductSchema", () => {
  const valid = {
    name: "Test Product",
    slug: "test-product",
    description: ["A great product"],
    madeIn: "Egypt",
    price: 250,
    stock: 10,
    images: ["/img1.jpg"],
    categoryId: "cat-1",
    familyId: "fam-1",
    brandId: null,
    isActive: true,
    archived: false,
    featured: false,
    bestSeller: false,
  };

  it("accepts valid product data without optional fields", () => {
    const result = addProductSchema.parse(valid);
    expect(result.name).toBe("Test Product");
    expect(result.price).toBe(250);
  });

  it("accepts valid product data with sku", () => {
    const result = addProductSchema.parse({ ...valid, sku: "SKU-001" });
    expect(result.sku).toBe("SKU-001");
  });

  it("accepts valid product data with attributes", () => {
    const result = addProductSchema.parse({
      ...valid,
      attributes: [
        { attributeTypeId: "type-1", attributeValueId: "val-1" },
        { attributeTypeId: "type-2", attributeValueId: "val-2" },
      ],
    });
    expect(result.attributes).toHaveLength(2);
  });

  it("rejects duplicate attributeTypeIds", () => {
    const result = addProductSchema.safeParse({
      ...valid,
      attributes: [
        { attributeTypeId: "type-1", attributeValueId: "val-a" },
        { attributeTypeId: "type-1", attributeValueId: "val-b" },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("one value per product");
    }
  });

  it("rejects negative price", () => {
    expect(addProductSchema.safeParse({ ...valid, price: -10 }).success).toBe(
      false
    );
  });

  it("rejects negative stock", () => {
    expect(addProductSchema.safeParse({ ...valid, stock: -1 }).success).toBe(
      false
    );
  });

  it("rejects empty name", () => {
    expect(addProductSchema.safeParse({ ...valid, name: "" }).success).toBe(
      false
    );
  });

  it("accepts null brandId", () => {
    const result = addProductSchema.parse({ ...valid, brandId: null });
    expect(result.brandId).toBeNull();
  });

  it("accepts null madeIn", () => {
    const result = addProductSchema.parse({ ...valid, madeIn: null });
    expect(result.madeIn).toBeNull();
  });
});

// ─── updateProductSchema ─────────────────────────────────────────────────────

describe("updateProductSchema", () => {
  const valid = {
    name: "Updated Product",
    description: ["Updated desc"],
    madeIn: "Egypt",
    images: ["/img.jpg"],
    categoryId: "cat-1",
    familyId: "fam-1",
    brandId: "br-1",
    isActive: true,
    archived: false,
    featured: true,
    bestSeller: false,
    price: 250,
    stock: 10,
  };

  it("accepts valid input", () => {
    expect(updateProductSchema.parse(valid)).toEqual(valid);
  });

  it("rejects empty name", () => {
    expect(
      updateProductSchema.safeParse({ ...valid, name: "" }).success
    ).toBe(false);
  });

  it("rejects empty categoryId", () => {
    expect(
      updateProductSchema.safeParse({ ...valid, categoryId: "" }).success
    ).toBe(false);
  });

  it("rejects empty familyId", () => {
    expect(
      updateProductSchema.safeParse({ ...valid, familyId: "" }).success
    ).toBe(false);
  });

  it("rejects negative price", () => {
    expect(
      updateProductSchema.safeParse({ ...valid, price: -1 }).success
    ).toBe(false);
  });

  it("rejects negative stock", () => {
    expect(
      updateProductSchema.safeParse({ ...valid, stock: -1 }).success
    ).toBe(false);
  });
});

// ─── purchaseInvoiceLineSchema ───────────────────────────────────────────────

describe("purchaseInvoiceLineSchema", () => {
  const valid = {
    productId: "prod-1",
    costPrice: 50,
    marginPercent: 20,
    quantityAdded: 10,
  };

  it("accepts valid line item", () => {
    expect(purchaseInvoiceLineSchema.parse(valid)).toEqual(valid);
  });

  it("rejects empty productId", () => {
    expect(
      purchaseInvoiceLineSchema.safeParse({ ...valid, productId: "" }).success
    ).toBe(false);
  });

  it("rejects zero costPrice", () => {
    expect(
      purchaseInvoiceLineSchema.safeParse({ ...valid, costPrice: 0 }).success
    ).toBe(false);
  });

  it("rejects zero marginPercent", () => {
    expect(
      purchaseInvoiceLineSchema.safeParse({
        ...valid,
        marginPercent: 0,
      }).success
    ).toBe(false);
  });

  it("rejects zero quantityAdded", () => {
    expect(
      purchaseInvoiceLineSchema.safeParse({
        ...valid,
        quantityAdded: 0,
      }).success
    ).toBe(false);
  });

  it("rejects non-integer quantityAdded", () => {
    expect(
      purchaseInvoiceLineSchema.safeParse({
        ...valid,
        quantityAdded: 2.5,
      }).success
    ).toBe(false);
  });
});

// ─── createPurchaseInvoiceSchema ─────────────────────────────────────────────

describe("createPurchaseInvoiceSchema", () => {
  const validLine = {
    productId: "prod-1",
    costPrice: 50,
    marginPercent: 20,
    quantityAdded: 10,
  };

  const valid = {
    supplierName: "Acme Corp",
    supplierPhone: "+20123456789",
    lines: [validLine],
  };

  it("accepts valid invoice data", () => {
    expect(createPurchaseInvoiceSchema.parse(valid)).toEqual(valid);
  });

  it("accepts optional invoiceNumber", () => {
    const result = createPurchaseInvoiceSchema.parse({
      ...valid,
      invoiceNumber: "INV-001",
    });
    expect(result.invoiceNumber).toBe("INV-001");
  });

  it("rejects empty supplier name", () => {
    expect(
      createPurchaseInvoiceSchema.safeParse({
        ...valid,
        supplierName: "",
      }).success
    ).toBe(false);
  });

  it("rejects empty lines array", () => {
    expect(
      createPurchaseInvoiceSchema.safeParse({ ...valid, lines: [] }).success
    ).toBe(false);
  });

  it("rejects duplicate productIds in lines", () => {
    const result = createPurchaseInvoiceSchema.safeParse({
      ...valid,
      lines: [validLine, { ...validLine, productId: "prod-1" }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("only appear once");
    }
  });

  it("accepts multiple unique productIds", () => {
    const result = createPurchaseInvoiceSchema.parse({
      ...valid,
      lines: [validLine, { ...validLine, productId: "prod-2" }],
    });
    expect(result.lines).toHaveLength(2);
  });
});
