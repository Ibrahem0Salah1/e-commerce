"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  createBrandSchema,
  updateBrandSchema,
  type CreateBrandForm,
  type CreateBrandFormInput,
} from "@/lib/brands/validations";
import {
  createBrandAndInvalidate,
  updateBrandAndInvalidate,
} from "@/lib/brands/actions";
import { slugify } from "@/lib/utils/slugify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BoolSelect, SlugDisplay } from "@/components/admin/shared";
import { Loader2 } from "lucide-react";

type BrandFormProps = {
  initialSlug?: string;
  defaultValues?: Partial<CreateBrandForm>;
};

export function BrandForm({ initialSlug, defaultValues }: BrandFormProps) {
  const router = useRouter();
  const isEdit = !!initialSlug;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateBrandFormInput>({
    resolver: zodResolver(isEdit ? updateBrandSchema : createBrandSchema),
    defaultValues: {
      name: defaultValues?.name,
      logo: defaultValues?.logo ?? "",
      description: defaultValues?.description ?? "",
      isActive: defaultValues?.isActive ?? true,
    },
  });

  const watchedName = watch("name");
  const liveSlug = slugify(watchedName || "");

  useEffect(() => {
    setValue("isActive", defaultValues?.isActive ?? true);
  }, [defaultValues?.isActive, setValue]);

  const onSubmit: SubmitHandler<CreateBrandFormInput> = async (data) => {
    try {
      if (isEdit && initialSlug) {
        await updateBrandAndInvalidate(initialSlug, data);
        toast.success("Brand updated");
      } else {
        await createBrandAndInvalidate(data);
        toast.success("Brand created");
      }
      router.push("/admin/brands");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-lg border border-border/40 bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {isEdit ? "Edit Brand" : "New Brand"}
        </h2>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground">
              Name
            </Label>
            <Input id="name" {...register("name")} placeholder="e.g. 3M" />
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
            <Label htmlFor="logo" className="text-xs uppercase tracking-wider text-muted-foreground">
              Logo URL
            </Label>
            <Input
              id="logo"
              {...register("logo")}
              placeholder="https://example.com/logo.png"
            />
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

          <BoolSelect control={control} name="isActive" label="Active" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Update Brand" : "Create Brand"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/brands")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
