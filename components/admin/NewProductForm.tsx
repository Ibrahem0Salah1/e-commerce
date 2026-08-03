"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  useForm,
  Controller,
  useFieldArray,
  type SubmitHandler,
  type Control,
  type UseFormRegister,
  type FieldErrors,
} from "react-hook-form";
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
  Eye,
  Plus,
  Trash2,
  ListTree,
  FileText,
} from "lucide-react";
import {
  ProductPreviewModal,
  type PreviewProduct,
} from "./ProductPreviewModal";

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
const ATTR_FIELD_MAP: Record<string, keyof AddProductForm> = {
  size: "sizeValueId",
  shade: "shadeValueId",
  color: "colorValueId",
  unit: "unitValueId",
};

const emptySpecGroup = () => ({
  name: "",
  position: 0,
  specs: [{ key: "", value: "", position: 0 }],
});

export function NewProductForm({ categories, brands, attributeTypes }: Props) {
  const router = useRouter();
  const [previewOpen, setPreviewOpen] = useState(false);

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
      specGroups: [],
    },
  });

  const {
    fields: specGroupFields,
    append: appendSpecGroup,
    remove: removeSpecGroup,
  } = useFieldArray({
    control,
    name: "specGroups",
  });

  /* ── Manual-edit detection for name ── */
  const [nameManuallyEdited, setNameManuallyEdited] = useState(false);
  const lastAutoName = useRef("");

  /* ── Watchers ── */
  const watchedCategoryId = watch("categoryId");
  const watchedFamilyId = watch("familyId");
  const watchedName = watch("name");
  const watchedBrandId = watch("brandId");
  const watchedPrice = watch("price");
  const watchedStock = watch("stock");
  const watchedSku = watch("sku");
  const watchedDescription = watch("description");
  const watchedImages = watch("images");
  const watchedSpecGroups = watch("specGroups");
  const watchedMadeIn = watch("madeIn");

  const selectedCategory = categories.find((c) => c.id === watchedCategoryId);
  const families = selectedCategory?.families ?? [];
  const selectedFamily = families.find((f) => f.id === watchedFamilyId);
  const selectedBrand = brands.find((b) => b.id === watchedBrandId);

  /* Build dynamic list of attribute field names */
  const attrFieldNames = useMemo(() => {
    const names: (keyof AddProductForm)[] = [];
    for (const type of attributeTypes) {
      const key = ATTR_FIELD_MAP[type.slug];
      if (key) names.push(key);
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

      const fieldIndex = attrFieldNames.indexOf(fieldKey);
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
    selectedFamily?.name,
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

  /* ── Live preview data ── */
  const previewProduct: PreviewProduct = useMemo(() => {
    const attributes: PreviewProduct["attributes"] = [];
    for (const type of attributeTypes) {
      const fieldKey = ATTR_FIELD_MAP[type.slug];
      if (!fieldKey) continue;
      const fieldIndex = attrFieldNames.indexOf(fieldKey);
      const valueId = watchedAttrValues[fieldIndex] as string | undefined;
      if (!valueId) continue;
      const val = type.values.find((v) => v.id === valueId);
      if (val) {
        attributes.push({
          typeName: type.name,
          typeSlug: type.slug,
          value: val.value,
        });
      }
    }

    const images = (watchedImages ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const description = (watchedDescription ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const specs = (watchedSpecGroups ?? [])
      .filter((g) => g?.name?.trim())
      .map((g) => ({
        name: g.name.trim(),
        specs: (g.specs ?? [])
          .filter((s) => s?.key?.trim() && s?.value?.trim())
          .map((s) => ({
            key: s.key.trim(),
            value: s.value.trim(),
          })),
      }))
      .filter((g) => g.specs.length > 0);

    return {
      name: watchedName ?? "",
      slug: watchedName ? slugify(watchedName) : "",
      description,
      price: typeof watchedPrice === "number" ? watchedPrice : 0,
      stock: typeof watchedStock === "number" ? watchedStock : 0,
      sku: watchedSku?.trim() || undefined,
      images,
      madeIn: watchedMadeIn?.trim() || null,
      brandName: selectedBrand?.name ?? null,
      categoryName: selectedCategory?.name ?? null,
      attributes,
      specs,
    };
  }, [
    watchedName,
    watchedPrice,
    watchedStock,
    watchedSku,
    watchedDescription,
    watchedImages,
    watchedSpecGroups,
    watchedMadeIn,
    watchedAttrValues,
    attrFieldNames,
    attributeTypes,
    selectedBrand?.name,
    selectedCategory?.name,
  ]);

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
        const valueId = data[fieldKey] as string | undefined;
        if (valueId) {
          attributes.push({
            attributeTypeId: type.id,
            attributeValueId: valueId,
          });
        }
      }

      const specGroups = (data.specGroups ?? [])
        .map((g, gi) => ({
          name: g.name.trim(),
          position: gi,
          specs: (g.specs ?? [])
            .filter((s) => s.key.trim() && s.value.trim())
            .map((s, si) => ({
              key: s.key.trim(),
              value: s.value.trim(),
              position: si,
            })),
        }))
        .filter((g) => g.name && g.specs.length > 0);

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
        specGroups: specGroups.length > 0 ? specGroups : undefined,
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
    hint,
  }: {
    icon: React.ElementType;
    label: string;
    hint?: string;
  }) => (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {label}
      </div>
      {hint ? (
        <p className="max-w-[60%] text-right text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );

  const ErrorMsg = ({ msg }: { msg?: string }) =>
    msg ? <p className="mt-1 text-xs text-destructive">{msg}</p> : null;

  const Helper = ({ text }: { text: string }) => (
    <p className="mt-1 text-xs text-muted-foreground">{text}</p>
  );

  return (
    <>
    <div className="sticky top-0 l-0 z-50">
      <Button
            type="button"
            variant="secondary"
            onClick={() => setPreviewOpen(true)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview product
          </Button>
    </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto max-w-3xl space-y-5"
      >
        {/* ═══════════════════════════════════════════
            1. CLASSIFICATION
            ═══════════════════════════════════════════ */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <SectionTitle
            icon={Layers}
            label="1. Classification"
            hint="Category & family drive the product name"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

          {/* Live identity (name + slug) */}
          <div className="mt-5 space-y-4 rounded-lg border border-dashed border-border/80 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Tag className="h-3.5 w-3.5" />
              Product identity (auto-generated)
            </div>

            <div className="space-y-1.5">
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
                    : "Fills from family + attributes. Type to override and freeze."
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-muted-foreground">
                URL Slug
                <span className="text-xs font-normal">(from name)</span>
              </Label>
              <div className="rounded-md border bg-muted/50 px-3 py-2 font-mono text-xs text-foreground">
                {watchedName ? slugify(watchedName) : "—"}
              </div>
              <Helper text="Locked permanently on save." />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            2. PRICING & INVENTORY
            ═══════════════════════════════════════════ */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <SectionTitle icon={DollarSign} label="2. Pricing & Inventory" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            3. ATTRIBUTES
            ═══════════════════════════════════════════ */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <SectionTitle
            icon={Box}
            label="3. Attributes"
            hint="Order controls how the product name is built"
          />

          <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {attributeTypes.map((type) => {
              const fieldKey = ATTR_FIELD_MAP[type.slug];
              if (!fieldKey) return null;

              return (
                <div key={type.id} className="space-y-1.5">
                  <Label className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{type.name}</span>
                    {type.displayOrder !== null && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                        Order {type.displayOrder}
                      </span>
                    )}
                  </Label>
                  <Controller
                    control={control}
                    name={fieldKey}
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
            4. METADATA
            ═══════════════════════════════════════════ */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <SectionTitle icon={FileText} label="4. Metadata" />

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register("description")}
              rows={4}
              placeholder="One paragraph per line — used as features & description on the product page"
              className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            <Helper text="Each line becomes a paragraph / feature bullet on the storefront." />
          </div>

          {/* Specifications */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ListTree className="h-4 w-4 text-muted-foreground" />
                Specifications
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendSpecGroup({
                    ...emptySpecGroup(),
                    position: specGroupFields.length,
                  })
                }
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add group
              </Button>
            </div>
            <Helper text="Groups appear as accordions on the product page (e.g. Physical Properties, Clinical)." />

            {specGroupFields.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                No specification groups yet. Add one to structure technical
                details.
              </div>
            ) : (
              <div className="space-y-4">
                {specGroupFields.map((group, groupIndex) => (
                  <SpecGroupEditor
                    key={group.id}
                    control={control}
                    register={register}
                    groupIndex={groupIndex}
                    onRemove={() => removeSpecGroup(groupIndex)}
                    errors={errors}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Images */}
          <div className="mt-6 space-y-1.5">
            <Label htmlFor="images" className="flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
              Images
            </Label>
            <textarea
              id="images"
              {...register("images")}
              rows={3}
              placeholder="One image URL per line"
              className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            <Helper text="Paste one public image URL per line. First image is the cover." />
          </div>

          {/* Status & Visibility */}
          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <Info className="h-4 w-4 text-muted-foreground" />
              Status & Visibility
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <BoolField control={control} name="isActive" label="Active" />
              <BoolField control={control} name="featured" label="Featured" />
              <BoolField
                control={control}
                name="bestSeller"
                label="Best Seller"
              />
              <BoolField control={control} name="archived" label="Archived" />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            ACTIONS
            ═══════════════════════════════════════════ */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          

          <div className="flex items-center gap-3">
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
        </div>
      </form>

      <ProductPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        product={previewProduct}
      />
    </>
  );
}

/* ───────────────────────────────────────────────
   Spec group editor (nested field array)
   ─────────────────────────────────────────────── */
function SpecGroupEditor({
  control,
  register,
  groupIndex,
  onRemove,
  errors,
}: {
  control: Control<AddProductForm>;
  register: UseFormRegister<AddProductForm>;
  groupIndex: number;
  onRemove: () => void;
  errors: FieldErrors<AddProductForm>;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `specGroups.${groupIndex}.specs`,
  });

  const groupError = errors.specGroups?.[groupIndex];

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Group name</Label>
          <Input
            {...register(`specGroups.${groupIndex}.name`)}
            placeholder="e.g. Physical Properties"
          />
          {groupError?.name?.message ? (
            <p className="text-xs text-destructive">{groupError.name.message}</p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mt-5 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          aria-label="Remove group"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground">
          <span>Key</span>
          <span>Value</span>
          <span className="w-9" />
        </div>

        {fields.map((row, rowIndex) => (
          <div
            key={row.id}
            className="grid grid-cols-[1fr_1fr_auto] items-start gap-2"
          >
            <Input
              {...register(`specGroups.${groupIndex}.specs.${rowIndex}.key`)}
              placeholder="e.g. Slot Size"
              className="h-9"
            />
            <Input
              {...register(`specGroups.${groupIndex}.specs.${rowIndex}.value`)}
              placeholder="e.g. 0.022 inch"
              className="h-9"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => remove(rowIndex)}
              disabled={fields.length <= 1}
              aria-label="Remove row"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() =>
          append({ key: "", value: "", position: fields.length })
        }
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        Add row
      </Button>
    </div>
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
  control: Control<AddProductForm>;
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
