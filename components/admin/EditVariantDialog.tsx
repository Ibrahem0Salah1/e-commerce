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
import { updateVariantAction } from "@/lib/products/admin-actions";

type VariantData = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  isLimitedQuantity: boolean;
  image: string | null;
  isActive: boolean;
  archived: boolean;
};

type Props = {
  variant: VariantData;
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

export function EditVariantDialog({ variant }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(variant.name);
  const [sku, setSku] = useState(variant.sku ?? "");
  const [price, setPrice] = useState(String(variant.price));
  const [stock, setStock] = useState(String(variant.stock));
  const [isLimitedQuantity, setIsLimitedQuantity] = useState(
    variant.isLimitedQuantity,
  );
  const [image, setImage] = useState(variant.image ?? "");
  const [isActive, setIsActive] = useState(variant.isActive);
  const [archived, setArchived] = useState(variant.archived);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    await updateVariantAction(variant.id, {
      name,
      sku: sku || null,
      price,
      stock,
      isLimitedQuantity,
      image: image || null,
      isActive,
      archived,
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
        <h2 className="mb-6 text-lg font-semibold">Edit Variant</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>SKU</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Price (EGP)</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Stock</Label>
              <Input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Image URL</Label>
            <Input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Active</Label>
              <BoolSelect value={isActive} onChange={setIsActive} />
            </div>
            <div className="space-y-1.5">
              <Label>Archived</Label>
              <BoolSelect value={archived} onChange={setArchived} />
            </div>
            <div className="space-y-1.5">
              <Label>Limited Qty</Label>
              <BoolSelect
                value={isLimitedQuantity}
                onChange={setIsLimitedQuantity}
              />
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
