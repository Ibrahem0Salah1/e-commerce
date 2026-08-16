"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { ProductPreviewModal, type PreviewProduct } from "./ProductPreviewModal";

export function ProductPreview({ product }: { product: PreviewProduct }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-50">
        <Button
          type="button"
          variant="secondary"
          onClick={() => setOpen(true)}
        >
          <Eye className="mr-2 h-4 w-4" />
          Preview product
        </Button>
      </div>
      <ProductPreviewModal
        open={open}
        onOpenChange={setOpen}
        product={product}
      />
    </>
  );
}