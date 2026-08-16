"use client";

import { useMemo } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { type AddProductForm, ATTR_FIELD_MAP } from "@/lib/validations";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Box } from "lucide-react";

type AttributeTypeOption = {
  id: string;
  name: string;
  slug: string;
  displayOrder: number | null;
  values: { id: string; value: string; slug: string }[];
};

type Props = {
  attributeTypes: AttributeTypeOption[];
};

export function AttributesSection({ attributeTypes }: Props) {
  const { control } = useFormContext<AddProductForm>();

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <SectionTitle
        icon={Box}
        label="3. Attributes"
        hint="Order controls how the product name is built"
      />

      <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {attributeTypes.map((type) => {
          const fieldKey = ATTR_FIELD_MAP[type.slug];
          if (!fieldKey) return null;

          return (
            <div key={type.id} className="space-y-1.5">
              <Label className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{type.name}</span>
                {type.displayOrder !== null && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
                    Order {type.displayOrder}
                  </span>
                )}
              </Label>
              <Controller
                control={control}
                name={fieldKey}
                render={({ field }) => (
                  <Select
                    value={(field.value as string) || "none"}
                    onValueChange={(v) =>
                      field.onChange(v === "none" ? "" : v)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={`Select ${type.name}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {type.values.map((val) => (
                        <SelectItem key={val.id} value={val.id}>
                          {val.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          );
        })}
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