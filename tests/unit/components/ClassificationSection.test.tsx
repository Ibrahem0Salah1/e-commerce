import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import { ClassificationSection } from "@/components/admin/formComponents/ClassificationSection";
import type { AddProductForm } from "@/lib/validations";

function comboboxByText(text: string) {
  const combo = screen
    .getAllByRole("combobox")
    .find((c) => (c.textContent ?? "").trim().includes(text));
  if (!combo) throw new Error(`No combobox containing "${text}"`);
  return combo;
}

const categories = [
  {
    id: "cat1",
    name: "Restorative",
    slug: "restorative",
    families: [{ id: "fam1", name: "Amalgam", slug: "amalgam" }],
  },
  {
    id: "cat2",
    name: "Consumables",
    slug: "consumables",
    families: [{ id: "fam2", name: "Anesthetic", slug: "anesthetic" }],
  },
];

const brands = [{ id: "br1", name: "Dentsply", slug: "dentsply" }];

const fam1Families = categories[0].families;

function Harness({
  variant,
  initial = {},
  onEdited,
}: {
  variant: "add" | "edit";
  initial?: Partial<AddProductForm>;
  onEdited: (v: boolean) => void;
}) {
  const form = useForm<AddProductForm>({
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      madeIn: "",
      price: 0,
      stock: 0,
      sku: "",
      images: [],
      categoryId: "",
      familyId: "",
      brandId: "",
      isActive: true,
      archived: false,
      featured: false,
      bestSeller: false,
      sizeValueId: "",
      unitValueId: "",
      colorValueId: "",
      shadeValueId: "",
      specGroups: [],
      ...initial,
    },
  });

  return (
    <FormProvider {...form}>
      <ClassificationSection
        categories={categories}
        brands={brands}
        families={fam1Families}
        variant={variant}
        lockedSlug={variant === "edit" ? "locked-slug" : undefined}
        nameManuallyEdited={false}
        onNameManuallyEdited={onEdited}
      />
    </FormProvider>
  );
}

function renderSection(
  variant: "add" | "edit",
  initial?: Partial<AddProductForm>,
) {
  const onEdited = vi.fn();
  const view = render(
    <Harness variant={variant} initial={initial} onEdited={onEdited} />,
  );
  return { onEdited, view };
}

describe("ClassificationSection — add variant", () => {
  it("resets name, slug and family when the category changes", async () => {
    const user = userEvent.setup();
    const { onEdited } = renderSection("add", {
      name: "Old Name",
      slug: "old-name",
      categoryId: "cat1",
      familyId: "fam1",
    });

    await user.click(comboboxByText("Restorative"));
    await user.click(
      await screen.findByRole("option", { name: "Consumables" }),
    );

    expect(screen.getByLabelText("Product Name")).toHaveValue("");
    expect(comboboxByText("Select family")).toBeInTheDocument();
    expect(onEdited).toHaveBeenCalledWith(false);
  });

  it("notifies manual editing when the user types a name", async () => {
    const user = userEvent.setup();
    const { onEdited } = renderSection("add");

    await user.type(screen.getByLabelText("Product Name"), "Custom");

    expect(onEdited).toHaveBeenCalledWith(true);
  });
});

describe("ClassificationSection — edit variant", () => {
  it("keeps the name and resets the family when the category changes", async () => {
    const user = userEvent.setup();
    const { onEdited } = renderSection("edit", {
      name: "Existing Name",
      categoryId: "cat1",
      familyId: "fam1",
    });

    await user.click(comboboxByText("Restorative"));
    await user.click(
      await screen.findByRole("option", { name: "Consumables" }),
    );

    expect(screen.getByLabelText("Product Name")).toHaveValue("Existing Name");
    expect(comboboxByText("Select family")).toBeInTheDocument();
    expect(onEdited).not.toHaveBeenCalled();
  });

  it("displays the locked slug", () => {
    renderSection("edit");
    expect(screen.getByText("locked-slug")).toBeInTheDocument();
    expect(screen.getByText(/\(locked\)/i)).toBeInTheDocument();
  });

  it("does not flag manual editing when the user types a name", async () => {
    const user = userEvent.setup();
    const { onEdited } = renderSection("edit", {
      name: "Existing Name",
      categoryId: "cat1",
    });

    await user.type(screen.getByLabelText("Product Name"), "X");

    expect(onEdited).not.toHaveBeenCalled();
  });

  it("shows the edit-mode helper copy", () => {
    renderSection("edit");
    expect(
      screen.getByText("Changing the family or attributes will not rename the product."),
    ).toBeInTheDocument();
  });
});

describe("ClassificationSection — brand select", () => {
  it("selecting a brand updates the trigger, selecting None clears it", async () => {
    const user = userEvent.setup();
    renderSection("add");

    await user.click(comboboxByText("None"));
    await user.click(await screen.findByRole("option", { name: "Dentsply" }));
    expect(comboboxByText("Dentsply")).toBeInTheDocument();

    await user.click(comboboxByText("Dentsply"));
    await user.click(await screen.findByRole("option", { name: "None" }));
    expect(comboboxByText("None")).toBeInTheDocument();
  });
});
