// import Image from "next/image";
// import { auth } from "@/lib/auth/server";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import Hero from "@/components/home/Hero";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
export default async function Home() {

  return (
    <>
      <main className="">
        <Header />
        <Hero />
        <FeaturedProducts />
        <TestimonialsSection />
      </main>
      <Footer />
    </>
  );
}
