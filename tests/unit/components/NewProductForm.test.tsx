import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewProductForm } from "@/components/admin/NewProductForm";

const { addProductAndInvalidateMock } = vi.hoisted(() => ({
  addProductAndInvalidateMock: vi.fn(),
}));

vi.mock("@/lib/admin/actions", () => ({
  addProductAndInvalidate: addProductAndInvalidateMock,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const categories = [
  {
    id: "cat1",
    name: "Restorative",
    slug: "restorative",
    families: [{ id: "fam1", name: "Amalgam", slug: "amalgam" }],
  },
];

const brands = [{ id: "br1", name: "Dentsply", slug: "dentsply" }];

const attributeTypes = [
  {
    id: "t-shade",
    name: "Shade",
    slug: "shade",
    displayOrder: 1,
    values: [{ id: "v-shade", value: "A1", slug: "a1" }],
  },
];

function setup() {
  return render(
    <NewProductForm
      categories={categories}
      brands={brands}
      attributeTypes={attributeTypes}
    />,
  );
}

describe("NewProductForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    addProductAndInvalidateMock.mockResolvedValue({});
  });

  it("renders all shared form sections and the actions", () => {
    setup();

    expect(screen.getByText("1. Classification")).toBeInTheDocument();
    expect(screen.getByText("2. Pricing & Inventory")).toBeInTheDocument();
    expect(screen.getByText("3. Attributes")).toBeInTheDocument();
    expect(screen.getByText("4. Metadata")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create Product" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /preview product/i }),
    ).toBeInTheDocument();
  });

  it("wires the classification fields into the shared form context (slug follows name)", async () => {
    const user = userEvent.setup();
    setup();

    await user.type(screen.getByLabelText("Product Name"), "Test Product");

    await waitFor(() =>
      expect(screen.getByText("test-product")).toBeInTheDocument(),
    );
  });

  it("renders the attribute selects for each mapped attribute type", () => {
    setup();
    expect(screen.getByText("Shade")).toBeInTheDocument();
    const noneCombos = screen
      .getAllByRole("combobox")
      .filter((c) => (c.textContent ?? "").trim().includes("None"));
    expect(noneCombos.length).toBeGreaterThan(0);
  });
});
