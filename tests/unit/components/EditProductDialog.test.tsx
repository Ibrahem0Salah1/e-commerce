import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { EditProductDialog } from "@/components/admin/EditProductDialog";
import type { AdminProductDetail } from "@/lib/types";

function comboboxByText(text: string) {
  const combo = screen
    .getAllByRole("combobox")
    .find((c) => (c.textContent ?? "").trim().includes(text));
  if (!combo) throw new Error(`No combobox containing "${text}"`);
  return combo;
}

const { updateProductAndInvalidateMock } = vi.hoisted(() => ({
  updateProductAndInvalidateMock: vi.fn(),
}));

vi.mock("@/lib/admin/actions", () => ({
  updateProductAndInvalidate: updateProductAndInvalidateMock,
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const categories = [
  {
    id: "cat1",
    name: "Restorative",
    slug: "restorative",
    families: [
      { id: "fam1", name: "Amalgam", slug: "amalgam" },
      { id: "fam2", name: "Composite", slug: "composite" },
    ],
  },
  {
    id: "cat2",
    name: "Consumables",
    slug: "consumables",
    families: [],
  },
];

const brands = [{ id: "br1", name: "Dentsply", slug: "dentsply" }];

const attributeTypes = [
  {
    id: "t-size",
    name: "Size",
    slug: "size",
    displayOrder: 1,
    values: [
      { id: "v-size-1", value: "1g", slug: "1g" },
      { id: "v-size-2", value: "2g", slug: "2g" },
    ],
  },
  {
    id: "t-shade",
    name: "Shade",
    slug: "shade",
    displayOrder: 2,
    values: [{ id: "v-shade-1", value: "A1", slug: "a1" }],
  },
];

const product = {
  id: "p1",
  name: "Amalgam Capsule",
  slug: "amalgam-capsule",
  description: ["Line one", "Line two"],
  madeIn: "Germany",
  price: 120,
  stock: 15,
  sku: "AMG-1",
  images: ["https://r2.example.com/a.jpg"],
  featured: false,
  bestSeller: true,
  isActive: true,
  archived: false,
  family: { id: "fam1", name: "Amalgam", slug: "amalgam" },
  brand: { id: "br1", name: "Dentsply", slug: "dentsply" },
  category: { id: "cat1", name: "Restorative", slug: "restorative" },
  attributeValues: [
    {
      attributeTypeId: "t-size",
      attributeType: { id: "t-size", name: "Size", slug: "size" },
      attributeValueId: "v-size-1",
      attributeValue: { id: "v-size-1", value: "1g", slug: "1g" },
    },
  ],
  specGroups: [
    {
      id: "sg1",
      name: "Physical",
      position: 0,
      specs: [
        { id: "s1", key: "Material", value: "Amalgam", position: 0 },
      ],
    },
  ],
  _count: { reviews: 0 },
} as unknown as AdminProductDetail;

function setup() {
  return render(
    <EditProductDialog
      product={product}
      categories={categories}
      brands={brands}
      attributeTypes={attributeTypes}
    />,
  );
}

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /edit/i }));
}

describe("EditProductDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateProductAndInvalidateMock.mockResolvedValue({});
  });

  it("shows an Edit button that opens the dialog", async () => {
    const user = userEvent.setup();
    setup();
    expect(screen.queryByText("Edit Product")).not.toBeInTheDocument();
    await openDialog(user);
    expect(screen.getByText("Edit Product")).toBeInTheDocument();
  });

  it("pre-fills the form from the product", async () => {
    const user = userEvent.setup();
    setup();
    await openDialog(user);

    expect(screen.getByLabelText("Product Name")).toHaveValue("Amalgam Capsule");
    expect(screen.getByLabelText("Description")).toHaveValue("Line one\nLine two");
    expect(screen.getByLabelText("SKU")).toHaveValue("AMG-1");
    // pricing is now read-only via restock, not editable inputs
    expect(screen.getByText("Selling Price")).toBeInTheDocument();
    expect(screen.getByText("120 EGP")).toBeInTheDocument();
  });

  it("locks the slug and shows the current slug", async () => {
    const user = userEvent.setup();
    setup();
    await openDialog(user);
    expect(screen.getByText("amalgam-capsule")).toBeInTheDocument();
    expect(screen.getByText(/\(locked\)/i)).toBeInTheDocument();
  });

  it("pre-selects category, family and brand", async () => {
    const user = userEvent.setup();
    setup();
    await openDialog(user);
    expect(comboboxByText("Restorative")).toBeInTheDocument();
    expect(comboboxByText("Amalgam")).toBeInTheDocument();
    expect(comboboxByText("Dentsply")).toBeInTheDocument();
  });

  it("seeds attributes and spec groups from the product", async () => {
    const user = userEvent.setup();
    setup();
    await openDialog(user);
    expect(screen.getByDisplayValue("Physical")).toBeInTheDocument();
    expect(comboboxByText("1g")).toBeInTheDocument();
  });

  it("keeps the name when the category changes in edit mode, and resets the family", async () => {
    const user = userEvent.setup();
    setup();
    await openDialog(user);

    await user.click(comboboxByText("Restorative"));
    await user.click(
      await screen.findByRole("option", { name: "Consumables" }),
    );

    expect(screen.getByLabelText("Product Name")).toHaveValue("Amalgam Capsule");
    expect(comboboxByText("Choose a category first")).toBeInTheDocument();
  });

  it("submits the mapped payload and closes on success", async () => {
    const user = userEvent.setup();
    setup();
    await openDialog(user);

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() =>
      expect(updateProductAndInvalidateMock).toHaveBeenCalledWith(
        "p1",
        expect.objectContaining({
          name: "Amalgam Capsule",
          description: ["Line one", "Line two"],
          madeIn: "Germany",
          familyId: "fam1",
          brandId: "br1",
          sku: "AMG-1",
          attributes: [
            { attributeTypeId: "t-size", attributeValueId: "v-size-1" },
          ],
          specGroups: [
            {
              name: "Physical",
              position: 0,
              specs: [{ key: "Material", value: "Amalgam", position: 0 }],
            },
          ],
        }),
      ),
    );

    expect(screen.queryByText("Edit Product")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(vi.mocked(toast.success)).toHaveBeenCalled(),
    );
  });

  it("shows an error toast when the update fails and stays open", async () => {
    const user = userEvent.setup();
    setup();
    await openDialog(user);

    updateProductAndInvalidateMock.mockRejectedValueOnce(new Error("boom"));

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() =>
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        "Failed to update product",
        expect.anything(),
      ),
    );
    expect(screen.getByText("Edit Product")).toBeInTheDocument();
  });

  it("blocks submission when the name is cleared", async () => {
    const user = userEvent.setup();
    setup();
    await openDialog(user);

    await user.clear(screen.getByLabelText("Product Name"));
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(
      await screen.findByText("Product name is required"),
    ).toBeInTheDocument();
    expect(updateProductAndInvalidateMock).not.toHaveBeenCalled();
  });

  it("cancels without saving", async () => {
    const user = userEvent.setup();
    setup();
    await openDialog(user);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByText("Edit Product")).not.toBeInTheDocument();
    expect(updateProductAndInvalidateMock).not.toHaveBeenCalled();
  });
});
