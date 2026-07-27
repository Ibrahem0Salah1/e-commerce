"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { addProductFormSchema, type AddProductForm } from "@/lib/validations";
import { addProductAndInvalidate } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Tag,
  Info,
  ImageIcon,
  DollarSign,
  Box,
  MapPin,
  Layers,
} from "lucide-react";

/* ───────────────────────────────────────────────
   Types
   ─────────────────────────────────────────────── */
type FamilyOption = { id: string; name: string; slug: string };

type CategoryWithFamilies = {
  id: string;
  name: string;
  slug: string;
  families: FamilyOption[];
};

type AttributeTypeOption = {
  id: string;
  name: string;
  slug: string;
  displayOrder: number | null;
  values: { id: string; value: string; slug: string }[];
};

type Props = {
  categories: CategoryWithFamilies[];
  brands: { id: string; name: string; slug: string }[];
  attributeTypes: AttributeTypeOption[];
};

/* ───────────────────────────────────────────────
   Slugify (creation-only)
   ─────────────────────────────────────────────── */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ───────────────────────────────────────────────
   Field map: attribute slug -> form field name
   ─────────────────────────────────────────────── */
const ATTR_FIELD_MAP: Record<string, string> = {
  size: "sizeValueId",
  shade: "shadeValueId",
  color: "colorValueId",
  unit: "unitValueId",
};

export function NewProductForm({ categories, brands, attributeTypes }: Props) {
  const router = useRouter();

  /* ── Form setup ── */
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddProductForm>({
    resolver: zodResolver(addProductFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      madeIn: "",
      price: 0,
      stock: 0,
      sku: "",
      images: "",
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
    },
  });

  /* ── Manual-edit detection for name ── */
  const [nameManuallyEdited, setNameManuallyEdited] = useState(false);
  const lastAutoName = useRef("");

  /* ── Watchers ── */
  const watchedCategoryId = watch("categoryId");
  const watchedFamilyId = watch("familyId");
  const watchedName = watch("name");

  const selectedCategory = categories.find((c) => c.id === watchedCategoryId);
  const families = selectedCategory?.families ?? [];
  const selectedFamily = families.find((f) => f.id === watchedFamilyId);

  /* Build dynamic list of attribute field names */
  const attrFieldNames = useMemo(() => {
    const names: (keyof AddProductForm)[] = [];
    for (const type of attributeTypes) {
      const key = ATTR_FIELD_MAP[type.slug];
      if (key) names.push(key as keyof AddProductForm);
    }
    return names;
  }, [attributeTypes]);

  const watchedAttrValues = watch(attrFieldNames);

  /* ── Effect: Auto-build name from Family + Attributes ── */
  useEffect(() => {
    if (nameManuallyEdited) return;

    const familyName = selectedFamily?.name;
    if (!familyName) {
      if (lastAutoName.current !== "") {
        lastAutoName.current = "";
        setValue("name", "");
      }
      return;
    }

    const selectedAttrs: { value: string; displayOrder: number }[] = [];

    for (const type of attributeTypes) {
      const fieldKey = ATTR_FIELD_MAP[type.slug];
      if (!fieldKey) continue;

      const fieldIndex = attrFieldNames.indexOf(
        fieldKey as keyof AddProductForm
      );
      const valueId = watchedAttrValues[fieldIndex] as string | undefined;
      if (!valueId) continue;

      const val = type.values.find((v) => v.id === valueId);
      if (val) {
        selectedAttrs.push({
          value: val.value,
          displayOrder: type.displayOrder ?? Infinity,
        });
      }
    }

    selectedAttrs.sort((a, b) => a.displayOrder - b.displayOrder);

    const parts = [familyName, ...selectedAttrs.map((a) => a.value)];
    const autoName = parts.join(" ");

    if (autoName !== lastAutoName.current) {
      lastAutoName.current = autoName;
      setValue("name", autoName, { shouldValidate: true });
    }
  }, [
    watchedAttrValues,
    attrFieldNames,
    attributeTypes,
    selectedFamily?.id,
    nameManuallyEdited,
    setValue,
  ]);

  /* ── Effect: Live slug derivation from current name ── */
  useEffect(() => {
    if (watchedName) {
      setValue("slug", slugify(watchedName), { shouldValidate: false });
    } else {
      setValue("slug", "", { shouldValidate: false });
    }
  }, [watchedName, setValue]);

  /* ── Submit ── */
  const onSubmit: SubmitHandler<AddProductForm> = async (data) => {
    try {
      const attributes: {
        attributeTypeId: string;
        attributeValueId: string;
      }[] = [];
      for (const type of attributeTypes) {
        const fieldKey = ATTR_FIELD_MAP[type.slug];
        if (!fieldKey) continue;
        const valueId = (data[fieldKey as keyof typeof data]) as string | undefined;
        if (valueId) {
          attributes.push({
            attributeTypeId: type.id,
            attributeValueId: valueId,
          });
        }
      }

      await addProductAndInvalidate({
        name: data.name,
        slug: data.slug,
        description: data.description
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
        madeIn: data.madeIn || null,
        price: data.price,
        stock: data.stock,
        sku: data.sku || undefined,
        images: data.images
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
        categoryId: data.categoryId,
        familyId: data.familyId,
        brandId: data.brandId || null,
        isActive: data.isActive,
        archived: data.archived,
        featured: data.featured,
        bestSeller: data.bestSeller,
        attributes: attributes.length > 0 ? attributes : undefined,
      });

      toast.success("Product created", {
        description: `${data.name} has been added.`,
      });
      router.push(`/admin/product/${data.slug}`);
    } catch (err) {
      toast.error("Failed to create product", {
        description:
          err instanceof Error ? err.message : "Something went wrong",
      });
    }
  };

  /* ── Render helpers ── */
  const SectionTitle = ({
    icon: Icon,
    label,
  }: {
    icon: React.ElementType;
    label: string;
  }) => (
    <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      {label}
    </div>
  );

  const ErrorMsg = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-xs text-destructive mt-1">{msg}</p> : null;

  const Helper = ({ text }: { text: string }) => (
    <p className="text-xs text-muted-foreground mt-1">{text}</p>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
      {/* ═══════════════════════════════════════════
          PRODUCT IDENTITY
          ═══════════════════════════════════════════ */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <SectionTitle icon={Tag} label="Product Identity" />

        {/* Name */}
        <div className="space-y-1.5 mb-4">
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Auto-generated from family & attributes"
            onChange={(e) => {
              if (!nameManuallyEdited) setNameManuallyEdited(true);
              register("name").onChange(e);
            }}
            className={
              nameManuallyEdited
                ? "border-amber-300 focus-visible:ring-amber-200"
                : ""
            }
          />
          <ErrorMsg msg={errors.name?.message} />
          <Helper
            text={
              nameManuallyEdited
                ? "Auto-generation paused. You are editing manually."
                : "Auto-fills from family + attributes. Type to override and freeze."
            }
          />
        </div>

        {/* Slug — read-only, live-derived */}
        <div className="space-y-1.5 mb-4">
          <Label className="flex items-center gap-1.5 text-muted-foreground">
            <Tag className="h-3.5 w-3.5" />
            URL Slug{" "}
            <span className="text-xs font-normal">(auto-derived from name)</span>
          </Label>
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            <span className="font-mono text-xs text-foreground">
              {watchedName ? slugify(watchedName) : "—"}
            </span>
          </div>
          <Helper text="Generated live from the name above. Locked permanently on save." />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            {...register("description")}
            rows={4}
            placeholder="One paragraph per line"
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 resize-y"
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          PRICING & INVENTORY
          ═══════════════════════════════════════════ */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <SectionTitle icon={DollarSign} label="Pricing & Inventory" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="price">Price (EGP)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min={0}
              {...register("price", { valueAsNumber: true })}
            />
            <ErrorMsg msg={errors.price?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              type="number"
              step="1"
              min={0}
              {...register("stock", { valueAsNumber: true })}
            />
            <ErrorMsg msg={errors.stock?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" {...register("sku")} placeholder="Optional" />
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <Label htmlFor="madeIn" className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            Made In
          </Label>
          <Input
            id="madeIn"
            {...register("madeIn")}
            placeholder="e.g. Germany"
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          MEDIA
          ═══════════════════════════════════════════ */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <SectionTitle icon={ImageIcon} label="Media" />
        <div className="space-y-1.5">
          <Label htmlFor="images">Images</Label>
          <textarea
            id="images"
            {...register("images")}
            rows={3}
            placeholder="One image URL per line"
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 resize-y"
          />
          <Helper text="Paste one public image URL per line. First image is the cover." />
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          CLASSIFICATION
          ═══════════════════════════════════════════ */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <SectionTitle icon={Layers} label="Classification" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category */}
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setValue("familyId", "");
                    setValue("name", "");
                    setValue("slug", "");
                    lastAutoName.current = "";
                    setNameManuallyEdited(false);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <ErrorMsg msg={errors.categoryId?.message} />
          </div>

          {/* Family */}
          <div className="space-y-1.5">
            <Label>Product Family</Label>
            <Controller
              control={control}
              name="familyId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Reset manual-edit so the new family seeds the name
                    setNameManuallyEdited(false);
                    lastAutoName.current = "";
                  }}
                  disabled={families.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        families.length === 0
                          ? "Choose a category first"
                          : "Select family"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {families.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <ErrorMsg msg={errors.familyId?.message} />
          </div>
        </div>

        {/* Brand */}
        <div className="mt-4 space-y-1.5">
          <Label>Brand</Label>
          <Controller
            control={control}
            name="brandId"
            render={({ field }) => (
              <Select
                value={field.value || "none"}
                onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          ATTRIBUTES
          ═══════════════════════════════════════════ */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <SectionTitle icon={Box} label="Attributes" />
        <Helper text="Selections are ordered automatically when building the product name." />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
          {attributeTypes.map((type) => {
            const fieldKey = ATTR_FIELD_MAP[type.slug];
            if (!fieldKey) return null;

            return (
              <div key={type.id} className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center justify-between">
                  <span>{type.name}</span>
                  {type.displayOrder !== null && (
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                      Order {type.displayOrder}
                    </span>
                  )}
                </Label>
                <Controller
                  control={control}
                  name={fieldKey as keyof AddProductForm}
                  render={({ field }) => (
                    <Select
                      value={(field.value as string) || "none"}
                      onValueChange={(v) =>
                        field.onChange(v === "none" ? "" : v)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={`Select ${type.name}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {type.values.map((val) => (
                          <SelectItem key={val.id} value={val.id}>
                            {val.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          STATUS & VISIBILITY
          ═══════════════════════════════════════════ */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <SectionTitle icon={Info} label="Status & Visibility" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <BoolField control={control} name="isActive" label="Active" />
          <BoolField control={control} name="featured" label="Featured" />
          <BoolField control={control} name="bestSeller" label="Best Seller" />
          <BoolField control={control} name="archived" label="Archived" />
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          ACTIONS
          ═══════════════════════════════════════════ */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/products")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating…
            </>
          ) : (
            "Create Product"
          )}
        </Button>
      </div>
    </form>
  );
}

/* ───────────────────────────────────────────────
   Bool field sub-component
   ─────────────────────────────────────────────── */
function BoolField({
  control,
  name,
  label,
}: {
  control: any;
  name: keyof AddProductForm;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select
            value={field.value ? "true" : "false"}
            onValueChange={(v) => field.onChange(v === "true")}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        )}
      />
    </div>
  );
}