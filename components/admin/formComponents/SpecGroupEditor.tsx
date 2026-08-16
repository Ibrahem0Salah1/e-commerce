"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import {
  useFieldArray,
  type Control,
  type UseFormRegister,
  type FieldErrors,
} from "react-hook-form";
import type { AddProductForm } from "@/lib/validations";

export function SpecGroupEditor({
  control,
  register,
  groupIndex,
  onRemove,
  errors,
}: {
  control: Control<AddProductForm>;
  register: UseFormRegister<AddProductForm>;
  groupIndex: number;
  onRemove: () => void;
  errors: FieldErrors<AddProductForm>;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `specGroups.${groupIndex}.specs`,
  });

  const groupError = errors.specGroups?.[groupIndex];

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Group name</Label>
          <Input
            {...register(`specGroups.${groupIndex}.name`)}
            placeholder="e.g. Physical Properties"
          />
          {groupError?.name?.message ? (
            <p className="text-xs text-destructive">{groupError.name.message}</p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mt-5 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          aria-label="Remove group"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground">
          <span>Key</span>
          <span>Value</span>
          <span className="w-9" />
        </div>

        {fields.map((row, rowIndex) => (
          <div
            key={row.id}
            className="grid grid-cols-[1fr_1fr_auto] items-start gap-2"
          >
            <Input
              {...register(`specGroups.${groupIndex}.specs.${rowIndex}.key`)}
              placeholder="e.g. Slot Size"
              className="h-9"
            />
            <Input
              {...register(`specGroups.${groupIndex}.specs.${rowIndex}.value`)}
              placeholder="e.g. 0.022 inch"
              className="h-9"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => remove(rowIndex)}
              disabled={fields.length <= 1}
              aria-label="Remove row"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() =>
          append({ key: "", value: "", position: fields.length })
        }
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        Add row
      </Button>
    </div>
  );
}