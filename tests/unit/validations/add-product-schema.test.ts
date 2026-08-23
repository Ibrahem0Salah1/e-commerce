import { describe, it, expect } from "vitest";
import {
  addProductFormSchema,
  addProductSchema,
  ATTR_FIELD_MAP,
} from "@/lib/validations";

const validForm = () => ({
  name: "Amalgam A1 2g",
  slug: "amalgam-a1-2g",
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
  bestSeller: false,
  sizeValueId: "v-size",
  unitValueId: "",
  colorValueId: "",
  shadeValueId: "v-shade",
  specGroups: [
    {
      name: "Physical",
      position: 0,
      specs: [{ key: "Material", value: "Amalgam", position: 0 }],
    },
  ],
});

describe("addProductFormSchema (client form)", () => {
  it("accepts a fully valid payload", () => {
    expect(addProductFormSchema.safeParse(validForm()).success).toBe(true);
  });

  it("requires a familyId", () => {
    expect(
      addProductFormSchema.safeParse({ ...validForm(), familyId: "" }).success,
    ).toBe(false);
    expect(
      addProductFormSchema.safeParse({ ...validForm(), familyId: "fam1" })
        .success,
    ).toBe(true);
  });

  it("requires a slug", () => {
    expect(
      addProductFormSchema.safeParse({ ...validForm(), slug: "" }).success,
    ).toBe(false);
  });

  it("requires at least one image", () => {
    expect(
      addProductFormSchema.safeParse({ ...validForm(), images: [] }).success,
    ).toBe(false);
  });

  it("rejects a zero or negative price", () => {
    expect(
      addProductFormSchema.safeParse({ ...validForm(), price: 0 }).success,
    ).toBe(false);
    expect(
      addProductFormSchema.safeParse({ ...validForm(), price: -1 }).success,
    ).toBe(false);
  });

  it("rejects negative stock", () => {
    expect(
      addProductFormSchema.safeParse({ ...validForm(), stock: -1 }).success,
    ).toBe(false);
  });

  it("accepts an empty sku", () => {
    expect(
      addProductFormSchema.safeParse({ ...validForm(), sku: "" }).success,
    ).toBe(true);
  });

  it("maps attribute type slugs to form fields", () => {
    expect(ATTR_FIELD_MAP).toEqual({
      size: "sizeValueId",
      shade: "shadeValueId",
      color: "colorValueId",
      unit: "unitValueId",
    });
  });
});

describe("addProductSchema (server payload)", () => {
  const validPayload = () => ({
    name: "Amalgam A1 2g",
    slug: "amalgam-a1-2g",
    description: ["Line one", "Line two"],
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
    bestSeller: false,
    attributes: [{ attributeTypeId: "t1", attributeValueId: "v1" }],
    specGroups: [
      { name: "Physical", position: 0, specs: [{ key: "k", value: "v", position: 0 }] },
    ],
  });

  it("accepts a fully valid payload", () => {
    expect(addProductSchema.safeParse(validPayload()).success).toBe(true);
  });

  it("accepts a missing familyId", () => {
    const { familyId: _omit, ...rest } = validPayload();
    expect(addProductSchema.safeParse(rest).success).toBe(true);
  });

  it("accepts a missing sku", () => {
    const { sku: _omit, ...rest } = validPayload();
    expect(addProductSchema.safeParse(rest).success).toBe(true);
  });

  it("accepts a null brandId", () => {
    expect(
      addProductSchema.safeParse({ ...validPayload(), brandId: null }).success,
    ).toBe(true);
  });

  it("rejects a string description (server expects an array)", () => {
    expect(
      addProductSchema.safeParse({
        ...validPayload(),
        description: "not an array",
      }).success,
    ).toBe(false);
  });

  it("accepts attributes when omitted", () => {
    const { attributes: _omit, ...rest } = validPayload();
    expect(addProductSchema.safeParse(rest).success).toBe(true);
  });

  it("rejects duplicate attributeTypeId entries", () => {
    expect(
      addProductSchema.safeParse({
        ...validPayload(),
        attributes: [
          { attributeTypeId: "t1", attributeValueId: "v1" },
          { attributeTypeId: "t1", attributeValueId: "v2" },
        ],
      }).success,
    ).toBe(false);
  });

  it("accepts a spec group with no specs (skipped by the action)", () => {
    expect(
      addProductSchema.safeParse({
        ...validPayload(),
        specGroups: [{ name: "Empty", position: 0, specs: [] }],
      }).success,
    ).toBe(true);
  });
});
