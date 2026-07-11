"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
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
import { Modal } from "./Modal";
import { updateProductAction } from "@/lib/products/admin-actions";
import type { AdminProductDetail } from "@/lib/types";
type ProductData = {
  id: string;
  name: string;
  slug: string;
  description: string[];
  madeIn: string | null;
  basePrice: number;
  images: string[];
  featured: boolean;
  bestSeller: boolean;
  isActive: boolean;
  archived: boolean;
  category: { id: string; name: string; slug: string };
  brand: { id: string; name: string; slug: string; logo: string | null } | null;
};

type Props = {
  product: AdminProductDetail;
  categories: { id: string; name: string; slug: string }[];
  brands: { id: string; name: string; slug: string }[];
};

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

export function EditProductDialog({ product, categories, brands }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(product.name);
  const [slug, setSlug] = useState(product.slug);
  const [description, setDescription] = useState(
    (product.description ?? []).join("\n"),
  );
  const [madeIn, setMadeIn] = useState(product.madeIn ?? "");
  const [basePrice, setBasePrice] = useState(String(product.basePrice));
  const [images, setImages] = useState(product.images.join("\n"));
  const [categoryId, setCategoryId] = useState(product.category.id);
  const [brandId, setBrandId] = useState(product.brand?.id ?? "none");
  const [isActive, setIsActive] = useState(product.isActive);
  const [archived, setArchived] = useState(product.archived);
  const [featured, setFeatured] = useState(product.featured);
  const [bestSeller, setBestSeller] = useState(product.bestSeller);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    await updateProductAction(product.id, {
      name,
      slug,
      description: description
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
      madeIn: madeIn || null,
      basePrice,
      images: images
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
      categoryId,
      brandId: brandId === "none" ? null : brandId,
      isActive,
      archived,
      featured,
      bestSeller,
    });

    setSaving(false);
    setOpen(false);
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="cursor-pointer"
      >
        <Pencil className="mr-1.5 h-4 w-4" />
        Edit
      </Button>

      <Modal open={open} onClose={() => setOpen(false)}>
        <h2 className="mb-6 text-lg font-semibold">Edit Product</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description (one paragraph per line)</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Base Price (EGP)</Label>
              <Input
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Made In</Label>
              <Input
                value={madeIn}
                onChange={(e) => setMadeIn(e.target.value)}
                placeholder="e.g. Germany"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Images (one URL per line)</Label>
            <textarea
              value={images}
              onChange={(e) => setImages(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Brand</Label>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Active</Label>
              <BoolSelect value={isActive} onChange={setIsActive} />
            </div>
            <div className="space-y-1.5">
              <Label>Archived</Label>
              <BoolSelect value={archived} onChange={setArchived} />
            </div>
            <div className="space-y-1.5">
              <Label>Featured</Label>
              <BoolSelect value={featured} onChange={setFeatured} />
            </div>
            <div className="space-y-1.5">
              <Label>Best Seller</Label>
              <BoolSelect value={bestSeller} onChange={setBestSeller} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="cursor-pointer"
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
