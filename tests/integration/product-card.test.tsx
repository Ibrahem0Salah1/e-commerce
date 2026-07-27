import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProductCard } from "@/components/products/ProductCard";
import type { ProductListItem } from "@/lib/types";

// mock useCart so we don't need the full provider tree
const mockAddItem = vi.fn();
vi.mock("@/hooks/useCart", () => ({
    useCart: () => ({
        addItem: mockAddItem,
        items: [],
        totalItems: 0,
        totalPrice: 0,
        isLoggedIn: false,
        isLoading: false,
    }),
}));

const mockProduct: ProductListItem = {
    id: "prod-1",
    name: "Nitrile Examination Gloves",
    slug: "nitrile-examination-gloves",
    description: ["Powder-free nitrile gloves"],
    images: ["/gloves.jpg"],
    featured: false,
    isActive: true,
    category: { id: "cat-1", name: "Disposables", slug: "disposables" },
    family: { id: "fam-1", name: "Gloves", slug: "gloves" },
    brand: null,
    price: 220,
    stock: 50,
    sku: "SKU-001",
    reviewCount: 5,
    rating: 4.5,
};

describe("ProductCard", () => {
    beforeEach(() => {
        mockAddItem.mockClear();
    });

    it("renders product name", () => {
        render(<ProductCard product={mockProduct} />);
        expect(screen.getByText("Nitrile Examination Gloves")).toBeInTheDocument();
    });

    it("renders price in EGP", () => {
        render(<ProductCard product={mockProduct} />);
        expect(screen.getByText(/EGP/)).toBeInTheDocument();
        expect(screen.getByText(/220/)).toBeInTheDocument();
    });

    it("calls addItem with correct product when cart button clicked", async () => {
        render(<ProductCard product={mockProduct} />);
        const cartBtn = screen.getByRole("button", { name: /add to cart/i });
        fireEvent.click(cartBtn);

        expect(mockAddItem).toHaveBeenCalledOnce();
        expect(mockAddItem).toHaveBeenCalledWith(
            expect.objectContaining({
                productId: "prod-1",
                name: "Nitrile Examination Gloves",
                price: 220,
            })
        );
    });

    it("shows Added feedback after clicking cart", async () => {
        render(<ProductCard product={mockProduct} />);
        const cartBtn = screen.getByRole("button", { name: /add to cart/i });
        fireEvent.click(cartBtn);

        await waitFor(() => {
            expect(cartBtn.className).toContain("bg-green-600");
        });
    });

    it("shows out of stock badge when product is out of stock", () => {
        const outOfStockProduct = {
            ...mockProduct,
            stock: 0,
        };
        render(<ProductCard product={outOfStockProduct} />);
        expect(screen.getAllByText("Out of Stock").length).toBeGreaterThan(0);
    });

    it("disables cart button when product is out of stock", () => {
        const outOfStockProduct = {
            ...mockProduct,
            stock: 0,
        };
        render(<ProductCard product={outOfStockProduct} />);
        const cartBtn = screen.getByRole("button", { name: /add to cart/i });
        expect(cartBtn).toBeDisabled();
    });

    it("does not render rating when product has reviews", () => {
        render(<ProductCard product={mockProduct} />);
        expect(screen.queryByText("4.5")).not.toBeInTheDocument();
        expect(screen.queryByText("(5)")).not.toBeInTheDocument();
    });
});
