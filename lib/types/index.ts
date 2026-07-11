import { z } from "zod";

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

export type OtpForm = z.infer<typeof otpSchema>;
export type SignUpFormFields = z.infer<typeof signUpSchema>;
export type SignInFormFields = z.infer<typeof signInSchema>;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string | null;
};

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  description: string[];
  basePrice: number;
  images: string[];
  featured: boolean;
  category: { id: string; name: string; slug: string };
  brand: { id: string; name: string; slug: string; logo: string | null } | null;
  variants: { id: string; name: string; price: number; stock: number }[];
  variantCount: number;
  reviewCount: number;
  rating: number | null;
};

export type CartItem = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  variantName: string;
  quantity: number;
};

export type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  description: string[] | null;
  basePrice: number;
  images: string[];
  featured: boolean;
  category: { id: string; name: string; slug: string };
  brand: { id: string; name: string; slug: string; logo: string | null } | null;
  variants: {
    id: string;
    name: string;
    sku: string | null;
    price: number;
    stock: number;
    image: string | null;
    isActive: boolean;
  }[];
  specs: {
    name: string;
    specs: { id: string; key: string; value: string }[];
  }[];
  reviews: {
    id: string;
    rating: number;
    title: string | null;
    body: string | null;
    createdAt: Date;
    user: { name: string; image: string | null };
  }[];
  reviewCount: number;
  rating: number | null;
};

export type AdminProductDetail = {
  id: string;
  name: string;
  slug: string;
  description: string[] | null;
  madeIn: string | null;
  basePrice: number;
  images: string[];
  featured: boolean;
  bestSeller: boolean;
  isActive: boolean;
  archived: boolean;
  category: { id: string; name: string; slug: string };
  brand: { id: string; name: string; slug: string; logo: string | null } | null;
  variants: {
    id: string;
    name: string;
    sku: string | null;
    price: number;
    stock: number;
    image: string | null;
    isActive: boolean;
  }[];
  specGroups: {
    id: string;
    name: string;
    position: number;
    specs: { id: string; key: string; value: string; position: number }[];
  }[];
  _count: { reviews: number };
};

export type VariantDetail = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  isLimitedQuantity: boolean;
  image: string | null;
  isActive: boolean;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
  product: { id: string; name: string; slug: string };
  productId: string;
};

export type ProductsResult = {
  products: ProductListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type Testimonial = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  verifiedPurchase: boolean;
  createdAt: string;
  user: { id: string; name: string; image: string | null };
  product: { id: string; name: string; slug: string };
};

export const filtersSchema = z.object({
  category: z.string().default(""),
  brand: z.string().default(""),
  featured: z.boolean().default(false),
  sort: z.enum(["price_asc", "price_desc", "name"]).default("name"),
  q: z.string().default(""),
});

export type FiltersFormFields = z.infer<typeof filtersSchema>;

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

export type CheckoutFormFields = z.infer<typeof checkoutSchema>;
