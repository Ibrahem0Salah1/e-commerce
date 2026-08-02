import { z } from "zod";

export const createFamilySchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().min(1, "Category is required"),
  isActive: z.boolean().default(true),
});

export const updateFamilySchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().min(1, "Category is required"),
  isActive: z.boolean().default(true),
});

export type CreateFamilyForm = z.infer<typeof createFamilySchema>;
export type UpdateFamilyForm = z.infer<typeof updateFamilySchema>;
export type CreateFamilyFormInput = z.input<typeof createFamilySchema>;
