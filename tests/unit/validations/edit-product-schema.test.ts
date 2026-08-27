import { describe, it, expect } from "vitest";
import {
  editProductFormSchema,
  updateProductSchema,
} from "@/lib/validations";

const validForm = () => ({
  name: "Amalgam Capsule",
  slug: "amalgam-capsule",
  description: "Line one\nLine two",
  madeIn: "Germany",
  price: 120,
  stock: 15,
  sku: "AMG-1",
  images: ["https://r2.example.com/a.jpg"],
  categoryId: "cat1",
  familyId: "fam1",
  brandId: "br1",
  isActive: true,
  archived: false,
  featured: false,
  bestSeller: true,
  sizeValueId: "",
  unitValueId: "",
  colorValueId: "",
  shadeValueId: "",
  specGroups: [
    {
      name: "Physical",
      position: 0,
      specs: [{ key: "Material", value: "Amalgam", position: 0 }],
    },
  ],
});

describe("editProductFormSchema (client form)", () => {
  it("accepts a fully valid payload", () => {
    const result = editProductFormSchema.safeParse(validForm());
    expect(result.success).toBe(true);
  });

  it("rejects an empty product name", () => {
    const result = editProductFormSchema.safeParse({
      ...validForm(),
      name: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("name");
    }
  });

  it("rejects a zero or negative price", () => {
    expect(
      editProductFormSchema.safeParse({ ...validForm(), price: 0 }).success,
    ).toBe(false);
    expect(
      editProductFormSchema.safeParse({ ...validForm(), price: -5 }).success,
    ).toBe(false);
  });

  it("rejects a negative stock", () => {
    expect(
      editProductFormSchema.safeParse({ ...validForm(), stock: -1 }).success,
    ).toBe(false);
  });

  it("rejects a fractional stock", () => {
    expect(
      editProductFormSchema.safeParse({ ...validForm(), stock: 2.5 }).success,
    ).toBe(false);
  });

  it("rejects an empty images array", () => {
    expect(
      editProductFormSchema.safeParse({ ...validForm(), images: [] }).success,
    ).toBe(false);
  });

  it("rejects more than 5 images", () => {
    const images = Array.from(
      { length: 6 },
      (_, i) => `https://r2.example.com/${i}.jpg`,
    );
    expect(
      editProductFormSchema.safeParse({ ...validForm(), images }).success,
    ).toBe(false);
  });

  it("rejects a non-URL image", () => {
    expect(
      editProductFormSchema.safeParse({
        ...validForm(),
        images: ["not-a-url"],
      }).success,
    ).toBe(false);
  });

  it("rejects an empty categoryId", () => {
    expect(
      editProductFormSchema.safeParse({ ...validForm(), categoryId: "" })
        .success,
    ).toBe(false);
  });

  it("accepts an empty familyId (products without a family)", () => {
    const result = editProductFormSchema.safeParse({
      ...validForm(),
      familyId: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty sku", () => {
    const result = editProductFormSchema.safeParse({
      ...validForm(),
      sku: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty attribute value ids", () => {
    const result = editProductFormSchema.safeParse({
      ...validForm(),
      sizeValueId: "",
      shadeValueId: "",
    });
    expect(result.success).toBe(true);
  });

  it("strips unknown keys", () => {
    const parsed = editProductFormSchema.parse({
      ...validForm(),
      unexpected: "nope",
    });
    expect(parsed).not.toHaveProperty("unexpected");
  });
});

describe("updateProductSchema (server payload)", () => {
  const validPayload = () => ({
    name: "Amalgam Capsule",
    description: ["Line one", "Line two"],
    madeIn: null,
    images: ["https://r2.example.com/a.jpg"],
    categoryId: "cat1",
    familyId: "fam1",
    brandId: null,
    isActive: true,
    archived: false,
    featured: false,
    bestSeller: true,
    price: 120,
    stock: 15,
    sku: "AMG-1",
    attributes: [{ attributeTypeId: "t1", attributeValueId: "v1" }],
    specGroups: [
      { name: "Physical", position: 0, specs: [{ key: "k", value: "v", position: 0 }] },
    ],
  });

  it("accepts familyId null (family removal)", () => {
    expect(
      updateProductSchema.safeParse({ ...validPayload(), familyId: null })
        .success,
    ).toBe(true);
  });

  it("accepts familyId as an empty string (normalized to null by the action)", () => {
    expect(
      updateProductSchema.safeParse({ ...validPayload(), familyId: "" }).success,
    ).toBe(true);
  });

  it("accepts sku null / undefined / empty string", () => {
    expect(
      updateProductSchema.safeParse({ ...validPayload(), sku: null }).success,
    ).toBe(true);
    expect(
      updateProductSchema.safeParse({ ...validPayload(), sku: undefined }).success,
    ).toBe(true);
    expect(
      updateProductSchema.safeParse({ ...validPayload(), sku: "" }).success,
    ).toBe(true);
  });

  it("accepts brandId null", () => {
    expect(
      updateProductSchema.safeParse({ ...validPayload(), brandId: null }).success,
    ).toBe(true);
  });

  it("rejects duplicate attributeTypeId entries", () => {
    const result = updateProductSchema.safeParse({
      ...validPayload(),
      attributes: [
        { attributeTypeId: "t1", attributeValueId: "v1" },
        { attributeTypeId: "t1", attributeValueId: "v2" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("accepts attributes when omitted", () => {
    const { attributes: _omit, ...rest } = validPayload();
    expect(updateProductSchema.safeParse(rest).success).toBe(true);
  });

  it("accepts a spec group with no specs (the action skips it)", () => {
    expect(
      updateProductSchema.safeParse({
        ...validPayload(),
        specGroups: [{ name: "Empty", position: 0, specs: [] }],
      }).success,
    ).toBe(true);
  });

  it("rejects a spec row with an empty key", () => {
    expect(
      updateProductSchema.safeParse({
        ...validPayload(),
        specGroups: [
          { name: "G", position: 0, specs: [{ key: "", value: "v", position: 0 }] },
        ],
      }).success,
    ).toBe(false);
  });

  it("does not validate image URLs (server trusts stored URLs)", () => {
    expect(
      updateProductSchema.safeParse({
        ...validPayload(),
        images: ["anything-goes"],
      }).success,
    ).toBe(true);
  });
});
