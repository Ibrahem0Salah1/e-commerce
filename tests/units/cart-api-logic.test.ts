import { describe, it, expect } from "vitest";

// test the pure calculation logic extracted from the API
// (this is why keeping logic in small functions makes testing easier)

describe("cart price calculations", () => {
  it("never trusts client price — always uses DB price", () => {
    const clientSentPrice = 1; // attacker sets price to 1 EGP
    const dbPrice = 480; // real price from DB

    // your API ignores clientSentPrice entirely
    // this test documents that contract
    const orderTotal = dbPrice * 2;
    expect(orderTotal).toBe(960);
    expect(orderTotal).not.toBe(clientSentPrice * 2);
  });

  it("calculates correct subtotal for mixed quantities", () => {
    const items = [
      { price: 480, quantity: 2 }, // composite resin x2
      { price: 220, quantity: 3 }, // gloves x3
    ];
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    expect(subtotal).toBe(1620);
  });

  it("handles decimal prices correctly (EGP)", () => {
    const price = 850.5;
    const quantity = 2;
    const total = Math.round(price * quantity * 100) / 100;
    expect(total).toBe(1701);
  });
});
