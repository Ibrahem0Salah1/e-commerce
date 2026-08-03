import type { ProductListRaw, ProductDetailRaw } from "@/lib/products/selects";
import type { AdminProductDetailRaw } from "@/lib/admin/selects";
import type { TestimonialRaw } from "@/lib/reviews/selects";
import type { CategoryListRaw, CategoryDetailRaw, CategoryOptionRaw, CategoryWithFamiliesRaw } from "@/lib/categories/selects";
import type { FamilyListRaw, FamilyDetailRaw } from "@/lib/families/selects";
import type { BrandListRaw, BrandDetailRaw } from "@/lib/brands/selects";

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
  "description" | "_count" | "reviews" | "family" | "price" | "stock" | "sku"
> & {
  category: { id: string; name: string; slug: string } | null;
  family: { id: string; name: string; slug: string } | null;
  price: number;
  stock: number | null;
  sku: string | null;
  description: string[];
  reviewCount: number;
  rating: number | null;
};

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

export type ProductDetail = Omit<
  ProductDetailRaw,
  "attributeValues" | "specGroups" | "_count" | "family" | "price" | "stock" | "sku"
> & {
  category: { id: string; name: string; slug: string } | null;
  family: { id: string; name: string; slug: string } | null;
  price: number;
  stock: number | null;
  sku: string | null;
  attributes: {
    typeName: string;
    typeSlug: string;
    value: string;
    valueSlug: string;
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
  "family" | "price" | "stock" | "sku"
> & {
  category: { id: string; name: string; slug: string } | null;
  family: { id: string; name: string; slug: string } | null;
  price: number;
  stock: number | null;
  sku: string | null;
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

/* ── Category types ── */
export type CategoryListItem = CategoryListRaw;
export type CategoryDetail = CategoryDetailRaw;
export type CategoryOption = CategoryOptionRaw;
export type CategoryWithFamilies = CategoryWithFamiliesRaw;

/* ── Family types ── */
export type FamilyListItem = FamilyListRaw;
export type FamilyDetail = FamilyDetailRaw;

/* ── Brand types ── */
export type BrandListItem = BrandListRaw;
export type BrandDetail = BrandDetailRaw;
