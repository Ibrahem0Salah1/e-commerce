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

export type SignUpFormFields = z.infer<typeof signUpSchema>;
export type SignInFormFields = z.infer<typeof signInSchema>;

//user's session type
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

//product
export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
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

//cart
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

//product detail page
export type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
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
  specs: { name: string; specs: { key: string; value: string }[] }[];
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

//product filters (used by getProducts client fn)

export type ProductsResult = {
  products: ProductListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

//review/testimonial
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
