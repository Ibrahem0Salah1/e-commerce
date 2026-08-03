import { BrandForm } from "@/components/admin/brands";

export default function NewBrandPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New Brand</h1>
        <p className="text-sm text-muted-foreground">
          Create a new product brand
        </p>
      </div>

      <BrandForm />
    </div>
  );
}
