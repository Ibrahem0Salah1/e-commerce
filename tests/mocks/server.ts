import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import type { CartItem } from "@/lib/types";

export const mockCartItems: CartItem[] = [
  {
    productId: "prod-1",
    slug: "latex-gloves",
    name: "Latex Gloves",
    price: 220,
    image: "/gloves.jpg",
    quantity: 2,
  },
];

export const server = setupServer(
  http.get("/api/cart", () => {
    return HttpResponse.json({ items: mockCartItems });
  }),

  http.post("/api/cart", () => {
    return HttpResponse.json({ success: true });
  }),

  http.patch("/api/cart", () => {
    return HttpResponse.json({ success: true });
  }),

  http.delete("/api/cart", () => {
    return HttpResponse.json({ success: true });
  }),
);
