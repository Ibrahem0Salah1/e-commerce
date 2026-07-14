"use client";

import { useRouter } from "next/navigation";
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
import { Loader2 } from "lucide-react";

type Props = {
  categories: { id: string; name: string; slug: string }[];
  brands: { id: string; name: string; slug: string }[];
};

export function NewProductForm({ categories, brands }: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
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
      images: "",
      categoryId: "",
      brandId: "",
      isActive: true,
      archived: false,
      featured: false,
      bestSeller: false,
    },
  });

  const onSubmit: SubmitHandler<AddProductForm> = async (data) => {
    try {
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
        images: data.images
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
        categoryId: data.categoryId,
        brandId: data.brandId || null,
        isActive: data.isActive,
        archived: data.archived,
        featured: data.featured,
        bestSeller: data.bestSeller,
      });
      toast.success("Product created", {
        description: `${data.name} has been added.`,
      });
      router.push(`/admin/product/${data.slug}`);
    } catch (err) {
      toast.error("Failed to create product", {
        description: err instanceof Error ? err.message : "Something went wrong",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input {...register("name")} placeholder="e.g. Viseralgine S1" />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Slug</Label>
          <Input {...register("slug")} placeholder="e.g. viseralgine-s1" />
          {errors.slug && (
            <p className="text-xs text-destructive">{errors.slug.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Description (one paragraph per line)</Label>
        <textarea
          {...register("description")}
          rows={3}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Price (EGP)</Label>
          <Input
            type="number"
            step="0.01"
            {...register("price", { valueAsNumber: true })}
          />
          {errors.price && (
            <p className="text-xs text-destructive">{errors.price.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            This becomes the Default variant&apos;s price
          </p>
        </div>
        <div className="space-y-1.5">
          <Label>Made In</Label>
          <Input {...register("madeIn")} placeholder="e.g. Germany" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Images (one URL per line)</Label>
        <textarea
          {...register("images")}
          rows={2}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
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
          {errors.categoryId && (
            <p className="text-xs text-destructive">{errors.categoryId.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Active</Label>
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <BoolSelect value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Featured</Label>
          <Controller
            control={control}
            name="featured"
            render={({ field }) => (
              <BoolSelect value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/products")}
          className="cursor-pointer"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Product"
          )}
        </Button>
      </div>
    </form>
  );
}

function BoolSelect({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Select
      value={value ? "true" : "false"}
      onValueChange={(v) => onChange(v === "true")}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="true">Yes</SelectItem>
        <SelectItem value="false">No</SelectItem>
      </SelectContent>
    </Select>
  );
}
