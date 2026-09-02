import { describe, it, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { useProductPreview } from "@/hooks/useProductPreview";
import type { AddProductForm } from "@/lib/validations";

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
  {
    id: "t-size",
    name: "Size",
    slug: "size",
    displayOrder: 2,
    values: [{ id: "v-size", value: "2g", slug: "2g" }],
  },
];

const defaults = (): AddProductForm => ({
  name: "",
  slug: "",
  description: "",
  madeIn: "",
  sku: "",
  images: [],
  categoryId: "",
  familyId: "",
  brandId: "",
  archived: false,
  featured: false,
  bestSeller: false,
  sizeValueId: "",
  unitValueId: "",
  colorValueId: "",
  shadeValueId: "",
  specGroups: [],
});

function setup() {
  const { result: formResult } = renderHook(() => useForm<AddProductForm>({
    defaultValues: defaults(),
  }));
  const { result } = renderHook(() =>
    useProductPreview({
      control: formResult.current.control,
      categories,
      brands,
      attributeTypes,
    }),
  );
  return { formResult, result };
}

describe("useProductPreview", () => {
  it("returns an empty preview for a fresh form", () => {
    const { result } = setup();

    expect(result.current).toEqual({
      name: "",
      slug: "",
      description: [],
      price: 0,
      stock: 0,
      sku: undefined,
      images: [],
      madeIn: null,
      brandName: null,
      categoryName: null,
      attributes: [],
      specs: [],
    });
  });

  it("builds the preview from watched form values", async () => {
    const { formResult, result } = setup();

    await act(async () => {
      formResult.current.setValue("name", "Amalgam A1 2g");
      formResult.current.setValue("sku", "  SKU-9  ");
      formResult.current.setValue("description", "Line one\n\nLine two");
      formResult.current.setValue("images", ["https://r2.example.com/a.jpg"]);
      formResult.current.setValue("madeIn", "  Germany  ");
      formResult.current.setValue("categoryId", "cat1");
      formResult.current.setValue("brandId", "br1");
      formResult.current.setValue("shadeValueId", "v-shade");
      formResult.current.setValue("sizeValueId", "v-size");
    });

    await waitFor(() =>
      expect(result.current.name).toBe("Amalgam A1 2g"),
    );

    expect(result.current.slug).toBe("amalgam-a1-2g");
    expect(result.current.description).toEqual(["Line one", "Line two"]);
    // pricing is now 0 / not set via form — set via restock only
    expect(result.current.price).toBe(0);
    expect(result.current.stock).toBe(0);
    expect(result.current.sku).toBe("SKU-9");
    expect(result.current.madeIn).toBe("Germany");
    expect(result.current.brandName).toBe("Dentsply");
    expect(result.current.categoryName).toBe("Restorative");
    expect(result.current.attributes).toEqual([
      { typeName: "Shade", typeSlug: "shade", value: "A1" },
      { typeName: "Size", typeSlug: "size", value: "2g" },
    ]);
  });

  it("drops empty spec rows and empty groups from the preview", async () => {
    const { formResult, result } = setup();

    await act(async () => {
      formResult.current.setValue("specGroups", [
        {
          name: "Physical",
          position: 0,
          specs: [
            { key: "Material", value: "Amalgam", position: 0 },
            { key: "  ", value: "", position: 1 },
          ],
        },
        {
          name: "   ",
          position: 1,
          specs: [{ key: "x", value: "y", position: 0 }],
        },
        { name: "Empty", position: 2, specs: [] },
      ]);
    });

    await waitFor(() =>
      expect(result.current.specs).toEqual([
        { name: "Physical", specs: [{ key: "Material", value: "Amalgam" }] },
      ]),
    );
  });
});
