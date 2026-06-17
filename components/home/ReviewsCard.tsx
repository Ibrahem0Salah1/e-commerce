import Image from "next/image";
import Link from "next/link";
import { Star, BadgeCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Testimonial } from "@/lib/types";

export function ReviewCard({ review }: { review: Testimonial }) {
    return (
        <Card className="flex h-full flex-col border-border">
            <CardContent className="flex flex-1 flex-col gap-3 p-6">
                <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? "fill-primary text-primary" : "text-border"}`}
                        />
                    ))}
                </div>

                {review.title && (
                    <h3 className="text-sm font-semibold text-foreground">{review.title}</h3>
                )}

                {review.body && (
                    <p className="line-clamp-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                        {review.body}
                    </p>
                )}

                <Link href={`/shop/${review.product.slug}`} className="text-xs font-medium text-primary hover:underline">
                    {review.product.name}
                </Link>

                <div className="flex items-center gap-3 border-t border-border pt-4">
                    <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-border">
                        {review.user.image ? (
                            <Image src={review.user.image} alt={review.user.name} fill className="object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-primary">
                                <span className="text-xs font-semibold text-primary-foreground">
                                    {review.user.name[0]?.toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground">{review.user.name}</p>
                        {review.verifiedPurchase && (
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                <BadgeCheck className="h-3.5 w-3.5 text-primary" /> Verified purchase
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}