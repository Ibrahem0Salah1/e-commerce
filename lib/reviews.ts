import { Testimonial } from "@/lib/types";
export async function getTestimonials(limit = 6): Promise<Testimonial[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/reviews?limit=${limit}&minRating=4`,
    { next: { revalidate: 300 } },
  );

  if (!res.ok) {
    throw new Error("Failed to fetch testimonials");
  }

  const data = await res.json();
  return data.reviews;
}
