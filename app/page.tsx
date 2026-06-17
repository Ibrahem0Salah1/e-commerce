// import Image from "next/image";
// import { auth } from "@/lib/auth";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import Hero from "@/components/home/Hero";
import { Header } from "@/components/layout/Header";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
export default async function Home() {

  return (
    <>
      <Header />
      <Hero />
      <FeaturedProducts />
      <TestimonialsSection />
    </>
  );
}
