import { z } from "zod";

// Empty string = no image (cleared). Anything else must be a valid URL.
const optionalUrl = z
  .string()
  .refine((value) => value === "" || z.string().url().safeParse(value).success, {
    message: "Enter a valid URL",
  });

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().default(""),
  image: optionalUrl.optional().default(""),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().default(""),
  image: optionalUrl.optional().default(""),
  isActive: z.boolean().default(true),
});

export type CreateCategoryForm = z.infer<typeof createCategorySchema>;
export type UpdateCategoryForm = z.infer<typeof updateCategorySchema>;
export type CreateCategoryFormInput = z.input<typeof createCategorySchema>;
