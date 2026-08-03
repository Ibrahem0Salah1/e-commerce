"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  createFamilySchema,
  updateFamilySchema,
  type CreateFamilyForm,
  type CreateFamilyFormInput,
} from "@/lib/families/validations";
import {
  createFamilyAndInvalidate,
  updateFamilyAndInvalidate,
} from "@/lib/families/actions";
import { slugify } from "@/lib/utils/slugify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BoolSelect, SlugDisplay } from "@/components/admin/shared";
import { Loader2 } from "lucide-react";

type FamilyFormProps = {
  categorySlug: string;
  categoryName: string;
  categoryId: string;
  familySlug?: string;
  defaultValues?: Partial<CreateFamilyForm>;
};

export function FamilyForm({
  categorySlug,
  categoryName,
  categoryId,
  familySlug,
  defaultValues,
}: FamilyFormProps) {
  const router = useRouter();
  const isEdit = !!familySlug;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateFamilyFormInput>({
    resolver: zodResolver(isEdit ? updateFamilySchema : createFamilySchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      categoryId: categoryId,
      isActive: defaultValues?.isActive ?? true,
    },
  });

  const watchedName = watch("name");
  const liveSlug = slugify(watchedName || "");

  useEffect(() => {
    setValue("isActive", defaultValues?.isActive ?? true);
  }, [defaultValues?.isActive, setValue]);

  useEffect(() => {
    setValue("categoryId", categoryId);
  }, [categoryId, setValue]);

  const onSubmit: SubmitHandler<CreateFamilyFormInput> = async (data) => {
    try {
      if (isEdit && familySlug) {
        await updateFamilyAndInvalidate(familySlug, data);
        toast.success("Family updated");
      } else {
        await createFamilyAndInvalidate(data);
        toast.success("Family created");
      }
      router.push(`/admin/categories/${categorySlug}/families`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-lg border border-border/40 bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {isEdit ? "Edit Family" : "New Family"}
        </h2>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Category
            </Label>
            <div className="rounded-md border border-border/40 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {categoryName}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground">
              Name
            </Label>
            <Input id="name" {...register("name")} placeholder="e.g. Composites" />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Slug
            </Label>
            <SlugDisplay slug={familySlug ?? liveSlug} />
          </div>

          <BoolSelect control={control} name="isActive" label="Active" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Update Family" : "Create Family"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            router.push(`/admin/categories/${categorySlug}/families`)
          }
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
