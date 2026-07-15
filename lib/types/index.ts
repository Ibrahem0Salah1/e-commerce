import type { ProductListRaw, ProductDetailRaw } from "@/lib/products/selects";
import type { AdminProductDetailRaw, VariantDetailRaw } from "@/lib/admin/selects";
import type { TestimonialRaw } from "@/lib/reviews/selects";

export type {
  OtpForm,
  SignUpFormFields,
  SignInFormFields,
  FiltersFormFields,
  CheckoutFormFields,
} from "@/lib/validations";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string | null;
};

export type ProductListItem = Omit<
  ProductListRaw,
  "basePrice" | "description" | "variants" | "_count" | "reviews" | "family"
> & {
  category: { id: string; name: string; slug: string } | null;
  family: { id: string; name: string; slug: string } | null;
  basePrice: number;
  description: string[];
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

export type ProductDetail = Omit<
  ProductDetailRaw,
  "basePrice" | "variants" | "specGroups" | "_count" | "family"
> & {
  category: { id: string; name: string; slug: string } | null;
  family: { id: string; name: string; slug: string } | null;
  basePrice: number;
  variants: {
    id: string;
    name: string;
    sku: string | null;
    price: number;
    stock: number;
    image: string | null;
    isActive: boolean;
    archived: boolean;
  }[];
  specs: {
    name: string;
    specs: { id: string; key: string; value: string }[];
  }[];
  reviewCount: number;
  rating: number | null;
};

export type AdminProductDetail = Omit<
  AdminProductDetailRaw,
  "basePrice" | "variants" | "family"
> & {
  category: { id: string; name: string; slug: string } | null;
  family: { id: string; name: string; slug: string } | null;
  basePrice: number;
  variants: {
    id: string;
    name: string;
    sku: string | null;
    price: number;
    stock: number;
    image: string | null;
    isActive: boolean;
    archived: boolean;
  }[];
};

export type VariantDetail = Omit<VariantDetailRaw, "price"> & {
  price: number;
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

export type Testimonial = Omit<TestimonialRaw, "createdAt"> & {
  createdAt: string;
};
