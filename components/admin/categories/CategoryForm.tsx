"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  createCategorySchema,
  updateCategorySchema,
  type CreateCategoryForm,
  type CreateCategoryFormInput,
} from "@/lib/categories/validations";
import {
  createCategoryAndInvalidate,
  updateCategoryAndInvalidate,
} from "@/lib/categories/actions";
import { slugify } from "@/lib/utils/slugify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { BoolSelect, SlugDisplay } from "@/components/admin/shared";
import { Loader2 } from "lucide-react";

type CategoryFormProps = {
  initialSlug?: string;
  defaultValues?: Partial<CreateCategoryForm>;
};

export function CategoryForm({
  initialSlug,
  defaultValues,
}: CategoryFormProps) {
  const router = useRouter();
  const isEdit = !!initialSlug;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryFormInput>({
    resolver: zodResolver(isEdit ? updateCategorySchema : createCategorySchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
      image: defaultValues?.image ?? "",
      isActive: defaultValues?.isActive ?? true,
    },
  });

  const watchedName = watch("name");
  const liveSlug = slugify(watchedName || "");

  useEffect(() => {
    setValue("isActive", defaultValues?.isActive ?? true);
  }, [defaultValues?.isActive, setValue]);

  const onSubmit: SubmitHandler<CreateCategoryFormInput> = async (data) => {
    try {
      if (isEdit && initialSlug) {
        await updateCategoryAndInvalidate(initialSlug, data);
        toast.success("Category updated");
      } else {
        await createCategoryAndInvalidate(data);
        toast.success("Category created");
      }
      router.push("/admin/categories");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-lg border border-border/40 bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {isEdit ? "Edit Category" : "New Category"}
        </h2>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground">
              Name
            </Label>
            <Input id="name" {...register("name")} placeholder="e.g. Restorative" />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Slug
            </Label>
            <SlugDisplay slug={initialSlug ?? liveSlug} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs uppercase tracking-wider text-muted-foreground">
              Description
            </Label>
            <textarea
              id="description"
              {...register("description")}
              placeholder="Optional description"
              rows={3}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="image" className="text-xs uppercase tracking-wider text-muted-foreground">
              Image URL
            </Label>
            <Input
              id="image"
              {...register("image")}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <BoolSelect control={control} name="isActive" label="Active" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Update Category" : "Create Category"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/categories")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
