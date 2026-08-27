import { describe, it, expect } from "vitest";
import {
  canTransitionOrderStatus,
  getAllowedNextStatuses,
  ALLOWED_ORDER_TRANSITIONS,
} from "@/lib/orders/state-machine";

describe("Order State Machine", () => {
  it("allows transition from PENDING to CONFIRMED or CANCELLED", () => {
    expect(canTransitionOrderStatus("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransitionOrderStatus("PENDING", "CANCELLED")).toBe(true);
    expect(canTransitionOrderStatus("PENDING", "DELIVERED")).toBe(false);
    expect(canTransitionOrderStatus("PENDING", "SHIPPED")).toBe(false);
  });

  it("allows transition from CONFIRMED to SHIPPED or CANCELLED", () => {
    expect(canTransitionOrderStatus("CONFIRMED", "SHIPPED")).toBe(true);
    expect(canTransitionOrderStatus("CONFIRMED", "CANCELLED")).toBe(true);
    expect(canTransitionOrderStatus("CONFIRMED", "PENDING")).toBe(false);
  });

  it("allows transition from SHIPPED to DELIVERED or CANCELLED", () => {
    expect(canTransitionOrderStatus("SHIPPED", "DELIVERED")).toBe(true);
    expect(canTransitionOrderStatus("SHIPPED", "CANCELLED")).toBe(true);
    expect(canTransitionOrderStatus("SHIPPED", "PENDING")).toBe(false);
  });

  it("treats DELIVERED and CANCELLED as terminal states", () => {
    expect(getAllowedNextStatuses("DELIVERED")).toEqual([]);
    expect(getAllowedNextStatuses("CANCELLED")).toEqual([]);

    expect(canTransitionOrderStatus("DELIVERED", "PENDING")).toBe(false);
    expect(canTransitionOrderStatus("DELIVERED", "CANCELLED")).toBe(false);
    expect(canTransitionOrderStatus("CANCELLED", "PENDING")).toBe(false);
    expect(canTransitionOrderStatus("CANCELLED", "CONFIRMED")).toBe(false);
  });

  it("allows staying in the same status (no-op)", () => {
    expect(canTransitionOrderStatus("PENDING", "PENDING")).toBe(true);
    expect(canTransitionOrderStatus("CONFIRMED", "CONFIRMED")).toBe(true);
    expect(canTransitionOrderStatus("DELIVERED", "DELIVERED")).toBe(true);
  });
});
