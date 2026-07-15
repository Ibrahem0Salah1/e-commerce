import { z } from "zod";

export type OtpForm = z.infer<typeof otpSchema>;
export type SignUpFormFields = z.infer<typeof signUpSchema>;
export type SignInFormFields = z.infer<typeof signInSchema>;
export type FiltersFormFields = z.infer<typeof filtersSchema>;
export type CheckoutFormFields = z.infer<typeof checkoutSchema>;
export type EditProductForm = z.infer<typeof editProductSchema>;
export type EditVariantForm = z.infer<typeof editVariantSchema>;
export type AddProductForm = z.infer<typeof addProductFormSchema>;
export type PurchaseInvoiceForm = z.infer<
  typeof createPurchaseInvoiceFormSchema
>;

export const signUpSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
});

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d+$/, "Code must contain only numbers"),
});

export const filtersSchema = z.object({
  category: z.string().default(""),
  family: z.string().default(""),
  brand: z.string().default(""),
  featured: z.boolean().default(false),
  sort: z.enum(["price_asc", "price_desc", "name"]).default("name"),
  q: z.string().default(""),
});

export const checkoutSchema = z.object({
  idempotencyKey: z.string().min(1),
  items: z
    .array(
      z.object({
        variantId: z.string().cuid(),
        quantity: z.number().int().min(1).max(100),
      }),
    )
    .min(1, "Cart cannot be empty"),
  couponCode: z.string().optional(),
  shippingName: z.string().min(2),
  shippingPhone: z.string().min(8),
  shippingAddress: z.string().min(5),
  shippingCity: z.string().min(2),
  shippingNotes: z.string().optional(),
  guestEmail: z.string().email().optional(),
  guestName: z.string().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.array(z.string()),
  madeIn: z.string().nullable(),
  images: z.array(z.string()),
  categoryId: z.string().min(1),
  familyId: z.string().min(1),
  brandId: z.string().nullable(),
  isActive: z.coerce.boolean(),
  archived: z.coerce.boolean(),
  featured: z.coerce.boolean(),
  bestSeller: z.coerce.boolean(),
});

export const addProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.array(z.string()),
  madeIn: z.string().nullable(),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0),
  images: z.array(z.string()),
  categoryId: z.string().min(1),
  familyId: z.string().min(1),
  brandId: z.string().nullable(),
  isActive: z.coerce.boolean(),
  archived: z.coerce.boolean(),
  featured: z.coerce.boolean(),
  bestSeller: z.coerce.boolean(),
});

export const updateVariantSchema = z.object({
  name: z.string().min(1),
  sku: z.string().nullable(),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0),
  isLimitedQuantity: z.coerce.boolean(),
  image: z.string().nullable(),
  isActive: z.coerce.boolean(),
  archived: z.coerce.boolean(),
});

export const editProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string(),
  madeIn: z.string(),
  images: z.string(),
  categoryId: z.string().min(1, "Category is required"),
  familyId: z.string().min(1, "Family is required"),
  brandId: z.string(),
  isActive: z.boolean(),
  archived: z.boolean(),
  featured: z.boolean(),
  bestSeller: z.boolean(),
});

export const addProductFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string(),
  madeIn: z.string(),
  price: z.number().positive("Price must be positive"),
  stock: z.number().int().min(0, "Stock can't be negative"),
  images: z.string(),
  categoryId: z.string().min(1, "Category is required"),
  familyId: z.string().min(1, "Family is required"),
  brandId: z.string(),
  isActive: z.boolean(),
  archived: z.boolean(),
  featured: z.boolean(),
  bestSeller: z.boolean(),
});

export const editVariantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string(),
  price: z.number().positive("Price must be positive"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  isLimitedQuantity: z.boolean(),
  image: z.string(),
  isActive: z.boolean(),
  archived: z.boolean(),
});

export const purchaseInvoiceLineSchema = z.object({
  variantId: z.string().min(1, "Select a variant"),
  costPrice: z.coerce.number().positive("Cost price must be greater than 0"),
  marginPercent: z.coerce.number().positive("Margin must be greater than 0"),
  quantityAdded: z.coerce
    .number()
    .int()
    .positive("Quantity must be at least 1"),
});

export const purchaseInvoiceLineFormSchema = z.object({
  variantId: z.string().min(1, "Select a variant"),
  costPrice: z.number().positive("Cost price must be greater than 0"),
  marginPercent: z.number().positive("Margin must be greater than 0"),
  quantityAdded: z.number().int().positive("Quantity must be at least 1"),
});

export const createPurchaseInvoiceSchema = z
  .object({
    supplierName: z.string().min(1, "Supplier name is required"),
    invoiceNumber: z.string().optional(),
    supplierPhone: z.string().min(1, "Supplier phone is required"),
    lines: z
      .array(purchaseInvoiceLineSchema)
      .min(1, "Add at least one product"),
  })
  .refine(
    (data) => {
      const ids = data.lines.map((l) => l.variantId);
      return ids.length === new Set(ids).size;
    },
    {
      message: "Each variant can only appear once per invoice",
      path: ["lines"],
    },
  );

export const createPurchaseInvoiceFormSchema = z
  .object({
    supplierName: z.string().min(1, "Supplier name is required"),
    invoiceNumber: z.string().optional(),
    supplierPhone: z.string().min(1, "Supplier phone is required"),
    lines: z
      .array(purchaseInvoiceLineFormSchema)
      .min(1, "Add at least one product"),
  })
  .refine(
    (data) => {
      const ids = data.lines.map((l) => l.variantId);
      return ids.length === new Set(ids).size;
    },
    {
      message: "Each variant can only appear once per invoice",
      path: ["lines"],
    },
  );
