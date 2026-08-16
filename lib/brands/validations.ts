import { z } from "zod";

// Empty string = no logo (cleared). Anything else must be a valid URL.
const optionalUrl = z
  .string()
  .refine((value) => value === "" || z.string().url().safeParse(value).success, {
    message: "Enter a valid URL",
  });

export const createBrandSchema = z.object({
  name: z.string().min(1, "Name is required"),
  logo: optionalUrl.optional().default(""),
  description: z.string().optional().default(""),
  isActive: z.boolean().default(true),
});

export const updateBrandSchema = z.object({
  name: z.string().min(1, "Name is required"),
  logo: optionalUrl.optional().default(""),
  description: z.string().optional().default(""),
  isActive: z.boolean().default(true),
});

export type CreateBrandForm = z.infer<typeof createBrandSchema>;
export type UpdateBrandForm = z.infer<typeof updateBrandSchema>;
export type CreateBrandFormInput = z.input<typeof createBrandSchema>;
