// components/shop/ProductsListServer.tsx (server component)
import { ProductsList } from "./ProductsList";
import { ProductsResult } from "@/lib/types";
export async function ProductsListServer({
    productsPromise,
}: {
    productsPromise: Promise<ProductsResult>;
}) {
    const initialData = await productsPromise;
    return <ProductsList initialData={initialData} />;
}