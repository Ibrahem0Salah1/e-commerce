import { z } from "zod";

export type OtpForm = z.infer<typeof otpSchema>;
export type SignUpFormFields = z.infer<typeof signUpSchema>;
export type SignInFormFields = z.infer<typeof signInSchema>;
export type FiltersFormFields = z.infer<typeof filtersSchema>;
export type CheckoutFormFields = z.infer<typeof checkoutSchema>;
export type EditProductForm = z.infer<typeof editProductFormSchema>;
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
  sort: z
    .enum([
      "price_asc",
      "price_desc",
      "name",
      "newest",
      "stock_asc",
      "stock_desc",
    ])
    .default("name"),
  q: z.string().default(""),
});

export const checkoutSchema = z.object({
  idempotencyKey: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.string().cuid(),
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


/* ───────────────────────────────────────────────
   Spec helpers (shared by client + server)
   ─────────────────────────────────────────────── */
const specRowFormSchema = z.object({
  key: z.string(),
  value: z.string(),
  position: z.number().int().min(0),
});

const specGroupFormSchema = z.object({
  name: z.string(),
  position: z.number().int().min(0),
  specs: z.array(specRowFormSchema),
});


/* ───────────────────────────────────────────────
   Add-product form schema (client-side)
   ─────────────────────────────────────────────── */
export const addProductFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string(),
  madeIn: z.string(),
  price: z.number().min(0.01, "Price must be greater than 0"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  sku: z.string(),
  images: z.array(z.string().url()).min(1, "At least one image required").max(5),
  categoryId: z.string().min(1, "Category is required"),
  familyId: z.string().min(1, "Family is required"),
  brandId: z.string(),
  isActive: z.boolean(),
  archived: z.boolean(),
  featured: z.boolean(),
  bestSeller: z.boolean(),
  sizeValueId: z.string(),
  unitValueId: z.string(),
  colorValueId: z.string(),
  shadeValueId: z.string(),
  specGroups: z.array(specGroupFormSchema),
});


/* ───────────────────────────────────────────────
   Edit-product form schema (client-side)
   Matches the add form shape (slug locked, never changed)
   ─────────────────────────────────────────────── */
export const editProductFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string(),
  description: z.string(),
  madeIn: z.string(),
  price: z.number().min(0.01, "Price must be greater than 0"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  sku: z.string(),
  images: z.array(z.string().url()).min(1, "At least one image required").max(5),
  categoryId: z.string().min(1, "Category is required"),
  familyId: z.string(),
  brandId: z.string(),
  isActive: z.boolean(),
  archived: z.boolean(),
  featured: z.boolean(),
  bestSeller: z.boolean(),
  sizeValueId: z.string(),
  unitValueId: z.string(),
  colorValueId: z.string(),
  shadeValueId: z.string(),
  specGroups: z.array(specGroupFormSchema),
});


/* ───────────────────────────────────────────────
   Server schemas (arrays + nulls)
   ─────────────────────────────────────────────── */
const productAttributeValueSchema = z.object({
  attributeTypeId: z.string(),
  attributeValueId: z.string(),
});

const productAttributesSchema = z
  .array(productAttributeValueSchema)
  .optional()
  .refine(
    (attrs) =>
      !attrs ||
      new Set(attrs.map((a) => a.attributeTypeId)).size === attrs.length,
    "Each attribute type can only have one value per product"
  );

const productSpecSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  position: z.number().int(),
});

const productSpecGroupSchema = z.object({
  name: z.string().min(1),
  position: z.number().int(),
  specs: z.array(productSpecSchema),
});

const productSpecGroupsSchema = z.array(productSpecGroupSchema).optional();

export const addProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.array(z.string()),
  madeIn: z.string().nullable(),
  price: z.number().min(0.01),
  stock: z.number().int().min(0),
  sku: z.string().optional(),
  images: z.array(z.string().url()).min(1, "At least one image required").max(5),
  categoryId: z.string(),
  familyId: z.string().optional(),
  brandId: z.string().nullable(),
  isActive: z.boolean(),
  archived: z.boolean(),
  featured: z.boolean(),
  bestSeller: z.boolean(),
  attributes: productAttributesSchema,
  specGroups: productSpecGroupsSchema,
});
//
export const ATTR_FIELD_MAP: Record<string, keyof AddProductForm> = {
  size: "sizeValueId",
  shade: "shadeValueId",
  color: "colorValueId",
  unit: "unitValueId",
};
//
export const updateProductSchema = z.object({
  name: z.string().min(1),
  description: z.array(z.string()),
  madeIn: z.string().nullable(),
  images: z.array(z.string()),
  categoryId: z.string(),
  familyId: z.string().nullable(),
  brandId: z.string().nullable(),
  isActive: z.boolean(),
  archived: z.boolean(),
  featured: z.boolean(),
  bestSeller: z.boolean(),
  price: z.number().min(0.01),
  stock: z.number().int().min(0),
  sku: z.string().nullable().optional(),
  attributes: productAttributesSchema,
  specGroups: productSpecGroupsSchema,
});

export const purchaseInvoiceLineSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  costPrice: z.coerce.number().positive("Cost price must be greater than 0"),
  marginPercent: z.coerce.number().positive("Margin must be greater than 0"),
  quantityAdded: z.coerce
    .number()
    .int()
    .positive("Quantity must be at least 1"),
});

export const purchaseInvoiceLineFormSchema = z.object({
  productId: z.string().min(1, "Select a product"),
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
      const ids = data.lines.map((l) => l.productId);
      return ids.length === new Set(ids).size;
    },
    {
      message: "Each product can only appear once per invoice",
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
      const ids = data.lines.map((l) => l.productId);
      return ids.length === new Set(ids).size;
    },
    {
      message: "Each product can only appear once per invoice",
      path: ["lines"],
    },
  );
