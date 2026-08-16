"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import type { AddProductForm } from "@/lib/validations";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ProductImageUploader } from "./ProductImageUploader";
import { SpecGroupEditor } from "./SpecGroupEditor";
import { BoolField } from "./BoolField";
import { FileText, ImageIcon, Info, ListTree, Plus } from "lucide-react";

export function MetadataSection() {
  const { control, register, setValue, watch, formState } =
    useFormContext<AddProductForm>();
  const errors = formState.errors;

  const watchedImages = watch("images");
  const watchedSpecGroups = watch("specGroups");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "specGroups",
  });

  const emptySpecGroup = () => ({
    name: "",
    position: 0,
    specs: [{ key: "", value: "", position: 0 }],
  });

  return (
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
              append({
                ...emptySpecGroup(),
                position: fields.length,
              })
            }
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add group
          </Button>
        </div>
        <Helper text="Groups appear as accordions on the product page (e.g. Physical Properties, Clinical)." />

        {fields.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            No specification groups yet. Add one to structure technical
            details.
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((group, groupIndex) => (
              <SpecGroupEditor
                key={group.id}
                control={control}
                register={register}
                groupIndex={groupIndex}
                onRemove={() => remove(groupIndex)}
                errors={errors}
              />
            ))}
          </div>
        )}
      </div>

      {/* Images */}
      <div className="mt-6 space-y-1.5">
        <Label className="flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
          Product Images
        </Label>
        <ProductImageUploader
          value={watchedImages}
          onChange={(urls) =>
            setValue("images", urls, { shouldValidate: true })
          }
          maxFiles={5}
        />
        {errors.images && (
          <p className="mt-1 text-xs text-destructive">
            {errors.images.message}
          </p>
        )}
        <Helper text="Upload up to 5 images. First image is the cover. Drag & drop or click to upload." />
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
          <BoolField control={control} name="bestSeller" label="Best Seller" />
          <BoolField control={control} name="archived" label="Archived" />
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {label}
      </div>
    </div>
  );
}

function Helper({ text }: { text: string }) {
  return <p className="mt-1 text-xs text-muted-foreground">{text}</p>;
}