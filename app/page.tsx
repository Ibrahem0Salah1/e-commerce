// import Image from "next/image";
// import { auth } from "@/lib/auth/server";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { BestsellerProducts } from "@/components/home/BestsellerProducts";
import { ShopByCategory } from "@/components/home/ShopByCategory";
import { ShopByBrands } from "@/components/home/ShopByBrands";
import { SupplyTicker } from "@/components/home/SupplyTicker";
import Hero from "@/components/home/Hero";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";

// The home page merges Redis-cached display data with fresh DB inventory on
// every request, and Upstash's SDK fetches with `cache: "no-store"`. Force
// dynamic rendering so `next build` doesn't try to statically prerender it.
export const dynamic = "force-dynamic";

export default async function Home() {
  return (
    <>
      <main className="">
        <Header />
        <Hero />
        <SupplyTicker />
        <ShopByCategory />
        <FeaturedProducts />
        <ShopByBrands />
        <BestsellerProducts />
        <TestimonialsSection />
        <Footer />
      </main>
    </>
  );
}
