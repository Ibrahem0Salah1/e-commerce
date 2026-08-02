"use client";

import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type BoolSelectProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
};

export function BoolSelect<T extends FieldValues>({ control, name, label }: BoolSelectProps<T>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name as string} className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select
            value={field.value ? "true" : "false"}
            onValueChange={(v) => field.onChange(v === "true")}
          >
            <SelectTrigger id={name as string}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        )}
      />
    </div>
  );
}
