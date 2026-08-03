import { z } from "zod";

export const createBrandSchema = z.object({
  name: z.string().min(1, "Name is required"),
  logo: z.string().optional().default(""),
  description: z.string().optional().default(""),
  isActive: z.boolean().default(true),
});

export const updateBrandSchema = z.object({
  name: z.string().min(1, "Name is required"),
  logo: z.string().optional().default(""),
  description: z.string().optional().default(""),
  isActive: z.boolean().default(true),
});

export type CreateBrandForm = z.infer<typeof createBrandSchema>;
export type UpdateBrandForm = z.infer<typeof updateBrandSchema>;
export type CreateBrandFormInput = z.input<typeof createBrandSchema>;
