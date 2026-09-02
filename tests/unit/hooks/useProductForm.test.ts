import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { useProductForm } from "@/hooks/useProductForm";
import { slugify } from "@/lib/utils/slugify";

const { addProductAndInvalidateMock, pushMock } = vi.hoisted(() => ({
  addProductAndInvalidateMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock("@/lib/admin/actions", () => ({
  addProductAndInvalidate: addProductAndInvalidateMock,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
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

function setup() {
  return renderHook(() =>
    useProductForm({ categories, brands, attributeTypes }),
  );
}

describe("useProductForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    addProductAndInvalidateMock.mockResolvedValue({});
  });

  it("auto-builds the name from family + attributes sorted by displayOrder", async () => {
    const { result } = setup();
    const { form } = result.current;

    await act(async () => {
      form.setValue("categoryId", "cat1");
    });
    await act(async () => {
      form.setValue("familyId", "fam1");
    });
    await waitFor(() => expect(form.getValues("name")).toBe("Amalgam"));

    await act(async () => {
      form.setValue("shadeValueId", "v-shade");
      form.setValue("sizeValueId", "v-size");
    });

    await waitFor(() =>
      expect(form.getValues("name")).toBe("Amalgam A1 2g"),
    );
  });

  it("derives the slug from the current name", async () => {
    const { result } = setup();
    const { form } = result.current;

    await act(async () => {
      form.setValue("categoryId", "cat1");
      form.setValue("familyId", "fam1");
      form.setValue("shadeValueId", "v-shade");
    });

    await waitFor(() => expect(form.getValues("slug")).toBe("amalgam-a1"));
  });

  it("clears the auto name when the family is removed", async () => {
    const { result } = setup();
    const { form } = result.current;

    await act(async () => {
      form.setValue("categoryId", "cat1");
      form.setValue("familyId", "fam1");
      form.setValue("shadeValueId", "v-shade");
    });
    await waitFor(() => expect(form.getValues("name")).toBe("Amalgam A1"));

    await act(async () => {
      form.setValue("familyId", "");
    });
    await waitFor(() => expect(form.getValues("name")).toBe(""));
    expect(form.getValues("slug")).toBe("");
  });

  it("freezes auto-generation once the name is edited manually", async () => {
    const { result } = setup();
    const { form } = result.current;

    await act(async () => {
      form.setValue("categoryId", "cat1");
      form.setValue("familyId", "fam1");
      form.setValue("shadeValueId", "v-shade");
    });
    await waitFor(() => expect(form.getValues("name")).toBe("Amalgam A1"));

    result.current.setNameManuallyEdited(true);

    await act(async () => {
      form.setValue("familyId", "fam2");
    });

    await waitFor(() =>
      expect(form.getValues("name")).toBe("Amalgam A1"),
    );
  });

  it("submits the mapped payload and redirects to the new product page", async () => {
    const { result } = setup();
    const { form, onSubmit } = result.current;

    await act(async () => {
      form.setValue("categoryId", "cat1");
      form.setValue("shadeValueId", "v-shade");
      form.setValue("sizeValueId", "v-size");
    });
    await act(async () => {
      form.setValue("familyId", "fam1");
    });
    await waitFor(() =>
      expect(form.getValues("name")).toBe("Amalgam A1 2g"),
    );

    await act(async () => {
      form.setValue("name", "Test Product");
      form.setValue("slug", slugify("Test Product"));
      form.setValue("description", "Line one\nLine two");
      form.setValue("images", ["https://r2.example.com/a.jpg"]);
    });

    await act(async () => {
      await onSubmit(form.getValues());
    });

    expect(addProductAndInvalidateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test Product",
        slug: "test-product",
        description: ["Line one", "Line two"],
        sku: undefined,
        familyId: "fam1",
        attributes: [
          { attributeTypeId: "t-shade", attributeValueId: "v-shade" },
          { attributeTypeId: "t-size", attributeValueId: "v-size" },
        ],
      }),
    );
    expect(pushMock).toHaveBeenCalledWith("/admin/product/test-product");
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
      "Product created",
      expect.anything(),
    );
  });

  it("shows an error toast and does not redirect when creation fails", async () => {
    const { result } = setup();
    const { form, onSubmit } = result.current;

    await act(async () => {
      form.setValue("categoryId", "cat1");
      form.setValue("familyId", "fam1");
      form.setValue("name", "Test Product");
      form.setValue("slug", slugify("Test Product"));
      form.setValue("images", ["https://r2.example.com/a.jpg"]);
    });

    addProductAndInvalidateMock.mockRejectedValueOnce(new Error("boom"));

    await act(async () => {
      await onSubmit(form.getValues());
    });

    expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
      "Failed to create product",
      expect.anything(),
    );
    expect(pushMock).not.toHaveBeenCalled();
  });
});
