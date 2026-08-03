import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().default(""),
  image: z.string().optional().default(""),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().default(""),
  image: z.string().optional().default(""),
  isActive: z.boolean().default(true),
});

export type CreateCategoryForm = z.infer<typeof createCategorySchema>;
export type UpdateCategoryForm = z.infer<typeof updateCategorySchema>;
export type CreateCategoryFormInput = z.input<typeof createCategorySchema>;
