import { describe, it, expect } from "vitest";
import { salesQuerySchema } from "@/lib/validations";

describe("salesQuerySchema", () => {
  it("defaults granularity=day, sortBy=profit, limit=20, deliveredOnly=false", () => {
    const p = salesQuerySchema.safeParse({});
    expect(p.success).toBe(true);
    if (p.success) {
      expect(p.data.granularity).toBe("day");
      expect(p.data.sortBy).toBe("profit");
      expect(p.data.limit).toBe(20);
      expect(p.data.deliveredOnly).toBe(false);
    }
  });

  it("accepts valid from/to strings and enums", () => {
    const p = salesQuerySchema.safeParse({
      from: "2026-01-01",
      to: "2026-01-31",
      granularity: "week",
      deliveredOnly: "true",
      sortBy: "revenue",
      limit: "10",
    });
    expect(p.success).toBe(true);
    if (p.success) {
      expect(p.data.from).toBe("2026-01-01");
      expect(p.data.deliveredOnly).toBe(true);
      expect(p.data.limit).toBe(10);
    }
  });

  it("transforms deliveredOnly 'false' → false, undefined → false", () => {
    expect(salesQuerySchema.safeParse({ deliveredOnly: "false" }).success).toBe(true);
    const r = salesQuerySchema.parse({ deliveredOnly: "false" });
    expect(r.deliveredOnly).toBe(false);
    expect(salesQuerySchema.parse({}).deliveredOnly).toBe(false);
  });

  it("rejects invalid granularity", () => {
    expect(salesQuerySchema.safeParse({ granularity: "hour" as never }).success).toBe(false);
  });

  it("rejects invalid sortBy", () => {
    expect(salesQuerySchema.safeParse({ sortBy: "price" as never }).success).toBe(false);
  });

  it("coerces limit and validates bounds 1..100", () => {
    expect(salesQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
    expect(salesQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
    expect(salesQuerySchema.safeParse({ limit: "50" }).success).toBe(true);
    expect(salesQuerySchema.safeParse({ limit: "abc" }).success).toBe(false);
  });

  it("rejects malformed from/to dates (YYYY-MM-DD required)", () => {
    expect(salesQuerySchema.safeParse({ from: "not-a-date" }).success).toBe(false);
    expect(salesQuerySchema.safeParse({ from: "2026-13-01" }).success).toBe(false);
    expect(salesQuerySchema.safeParse({ from: "2026-02-30" }).success).toBe(false);
    expect(salesQuerySchema.safeParse({ from: "2026/01/01" }).success).toBe(false);
    expect(salesQuerySchema.safeParse({ from: "" }).success).toBe(true); // empty → preprocess to undefined → allowed
  });

  it("accepts null and valid calendar dates", () => {
    expect(salesQuerySchema.safeParse({ from: null }).success).toBe(true);
    expect(salesQuerySchema.safeParse({ from: "2026-01-31" }).success).toBe(true);
    expect(salesQuerySchema.safeParse({ from: "2024-02-29" }).success).toBe(true); // leap year
    expect(salesQuerySchema.safeParse({ from: "2023-02-29" }).success).toBe(false); // invalid leap
  });
});
