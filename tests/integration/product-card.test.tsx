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
    description: "Powder-free nitrile gloves",
    basePrice: 220,
    images: ["/gloves.jpg"],
    featured: false,
    category: { id: "cat-1", name: "Disposables", slug: "disposables" },
    brand: null,
    variants: [
        { id: "var-1", name: "Small", price: 220, stock: 50 },
        { id: "var-2", name: "Medium", price: 220, stock: 30 },
        { id: "var-3", name: "Large", price: 220, stock: 0 },
    ],
    variantCount: 3,
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
        expect(screen.getByText("220")).toBeInTheDocument();
        expect(screen.getByText("EGP")).toBeInTheDocument();
    });

    it("renders variant buttons when product has multiple variants", () => {
        render(<ProductCard product={mockProduct} />);
        expect(screen.getByRole("button", { name: "Small" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Medium" })).toBeInTheDocument();
    });

    it("shows out-of-stock variant as disabled", () => {
        render(<ProductCard product={mockProduct} />);
        const largeBtn = screen.getByRole("button", { name: "Large" });
        expect(largeBtn).toBeDisabled();
    });

    it("calls addItem with correct variant when cart button clicked", async () => {
        render(<ProductCard product={mockProduct} />);
        const cartBtn = screen.getByRole("button", { name: /cart/i });
        fireEvent.click(cartBtn);

        expect(mockAddItem).toHaveBeenCalledOnce();
        expect(mockAddItem).toHaveBeenCalledWith(
            expect.objectContaining({
                variantId: "var-1", // first variant selected by default
                name: "Nitrile Examination Gloves",
                price: 220,
            })
        );
    });

    it("adds the selected variant when user picks a different one", async () => {
        render(<ProductCard product={mockProduct} />);

        // select Medium variant
        fireEvent.click(screen.getByRole("button", { name: "Medium" }));
        // click add to cart
        fireEvent.click(screen.getByRole("button", { name: /cart/i }));

        expect(mockAddItem).toHaveBeenCalledWith(
            expect.objectContaining({ variantId: "var-2" })
        );
    });

    it("shows Added! feedback after clicking cart", async () => {
        render(<ProductCard product={mockProduct} />);
        fireEvent.click(screen.getByRole("button", { name: /cart/i }));

        await waitFor(() => {
            expect(screen.getByText("Added!")).toBeVisible();
        });
    });

    it("shows out of stock badge when default variant is out of stock", () => {
        const outOfStockProduct = {
            ...mockProduct,
            variants: [{ id: "var-1", name: "Small", price: 220, stock: 0 }],
        };
        render(<ProductCard product={outOfStockProduct} />);
        expect(screen.getAllByText("Out of stock").length).toBeGreaterThan(0);
    });

    it("disables cart button when variant is out of stock", () => {
        const outOfStockProduct = {
            ...mockProduct,
            variants: [{ id: "var-1", name: "Small", price: 220, stock: 0 }],
        };
        render(<ProductCard product={outOfStockProduct} />);
        const cartBtn = screen.getByRole("button", { name: /out of stock/i });
        expect(cartBtn).toBeDisabled();
    });

    it("shows rating when product has reviews", () => {
        render(<ProductCard product={mockProduct} />);
        expect(screen.getByText("4.5")).toBeInTheDocument();
        expect(screen.getByText("(5)")).toBeInTheDocument();
    });
});