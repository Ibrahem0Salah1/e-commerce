import { ProductListItem } from "./types";
export async function getFeaturedProducts(
  limit = 8,
): Promise<ProductListItem[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/products?featured=true&limit=${limit}`,
    { next: { revalidate: 300 } },
  );

  if (!res.ok) {
    throw new Error("Failed to fetch featured products");
  }

  const data = await res.json();
  return data.products;
}
