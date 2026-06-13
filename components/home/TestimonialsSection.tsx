import { ReviewCard } from "@/components/home/ReviewsCard";
import { getTestimonials } from "@/lib/reviews";

export async function TestimonialsSection() {
    const reviews = await getTestimonials(6);

    if (reviews.length === 0) return null;

    return (
        <section className="bg-secondary/30 py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
                        Trusted by dental professionals
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        See what clinics across Egypt are saying
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {reviews.slice(0, 3).map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))}
                </div>
            </div>
        </section>
    );
}