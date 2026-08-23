import { describe, it, expect } from "vitest";
import {
  createCategorySchema,
  updateCategorySchema,
} from "@/lib/categories/validations";
import {
  createBrandSchema,
  updateBrandSchema,
} from "@/lib/brands/validations";

const VALID_URL = "https://r2.example.com/restorative.png";

describe("category image validation", () => {
  it("accepts a valid image URL", () => {
    const result = createCategorySchema.safeParse({
      name: "Restorative",
      image: VALID_URL,
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty image (cleared)", () => {
    const result = createCategorySchema.safeParse({
      name: "Restorative",
      image: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed image URL", () => {
    const result = createCategorySchema.safeParse({
      name: "Restorative",
      image: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("validates the same way on update", () => {
    const bad = updateCategorySchema.safeParse({
      name: "Restorative",
      image: "not-a-url",
    });
    const good = updateCategorySchema.safeParse({
      name: "Restorative",
      image: VALID_URL,
    });
    expect(bad.success).toBe(false);
    expect(good.success).toBe(true);
  });
});

describe("brand logo validation", () => {
  it("accepts a valid logo URL", () => {
    const result = createBrandSchema.safeParse({
      name: "3M",
      logo: VALID_URL,
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty logo (cleared)", () => {
    const result = createBrandSchema.safeParse({
      name: "3M",
      logo: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed logo URL", () => {
    const result = createBrandSchema.safeParse({
      name: "3M",
      logo: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("validates the same way on update", () => {
    const bad = updateBrandSchema.safeParse({
      name: "3M",
      logo: "not-a-url",
    });
    const good = updateBrandSchema.safeParse({
      name: "3M",
      logo: VALID_URL,
    });
    expect(bad.success).toBe(false);
    expect(good.success).toBe(true);
  });
});
