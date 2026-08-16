"use client";

import { useFormContext, Controller } from "react-hook-form";
import type { AddProductForm } from "@/lib/validations";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tag } from "lucide-react";
import { slugify } from "@/lib/utils/slugify";

type FamilyOption = { id: string; name: string; slug: string };

type CategoryWithFamilies = {
  id: string;
  name: string;
  slug: string;
  families: FamilyOption[];
};

type Props = {
  categories: CategoryWithFamilies[];
  brands: { id: string; name: string; slug: string }[];
  families: FamilyOption[];
  variant?: "add" | "edit";
  lockedSlug?: string;
  nameManuallyEdited: boolean;
  onNameManuallyEdited: (v: boolean) => void;
};

export function ClassificationSection({
  categories,
  brands,
  families,
  variant = "add",
  lockedSlug,
  nameManuallyEdited,
  onNameManuallyEdited,
}: Props) {
  const { control, register, setValue, watch, formState } =
    useFormContext<AddProductForm>();
  const errors = formState.errors;

  const isEdit = variant === "edit";
  const watchedName = watch("name");

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <SectionTitle
        icon={Tag}
        label="1. Classification"
        hint={
          isEdit
            ? "Category & family classify the product"
            : "Category & family drive the product name"
        }
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
                  if (isEdit) return;
                  setValue("name", "");
                  setValue("slug", "");
                  onNameManuallyEdited(false);
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
          {errors.categoryId?.message && (
            <p className="mt-1 text-xs text-destructive">
              {errors.categoryId.message}
            </p>
          )}
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
                  if (!isEdit) onNameManuallyEdited(false);
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
          {errors.familyId?.message && (
            <p className="mt-1 text-xs text-destructive">
              {errors.familyId.message}
            </p>
          )}
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
          Product identity {isEdit ? "" : "(auto-generated)"}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder={
              isEdit
                ? "Product name"
                : "Auto-generated from family & attributes"
            }
            onChange={(e) => {
              if (!isEdit && !nameManuallyEdited) onNameManuallyEdited(true);
              register("name").onChange(e);
            }}
            className={
              !isEdit && nameManuallyEdited
                ? "border-amber-300 focus-visible:ring-amber-200"
                : ""
            }
          />
          {errors.name?.message && (
            <p className="mt-1 text-xs text-destructive">
              {errors.name.message}
            </p>
          )}
          <Helper
            text={
              isEdit
                ? "Changing the family or attributes will not rename the product."
                : nameManuallyEdited
                  ? "Auto-generation paused. You are editing manually."
                  : "Fills from family + attributes. Type to override and freeze."
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-muted-foreground">
            URL Slug
            <span className="text-xs font-normal">
              {isEdit ? "(locked)" : "(from name)"}
            </span>
          </Label>
          <div className="rounded-md border bg-muted/50 px-3 py-2 font-mono text-xs text-foreground">
            {isEdit ? lockedSlug || "\u2014" : watchedName ? slugify(watchedName) : "\u2014"}
          </div>
          <Helper
            text={
              isEdit
                ? "Slug is permanent after creation to preserve existing links, cart URLs, and bookmarks."
                : "Locked permanently on save."
            }
          />
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  label,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  hint?: string;
}) {
  return (
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
}

function Helper({ text }: { text: string }) {
  return <p className="mt-1 text-xs text-muted-foreground">{text}</p>;
}