import Link from "next/link";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";

export interface CardData {
  id: number;
  title: string;
  category: string;
  image: string;
  slug: string;
  brand: string;
  price: number;
  variantsCount: number;
  rating: number | null;
  reviewCount: number;
  description: string | null;
}

export function CardsSlider({ cards }: { cards: CardData[] }) {
  return (
    <Carousel opts={{ align: "start" }} className="w-full">
      <CarouselContent className="-ml-4">
        {cards.map((card, i) => (
          <CarouselItem
            key={card.id}
            className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
          >
            <CardItem card={card} priority={i < 2} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}

function CardItem({ card, priority }: { card: CardData; priority?: boolean }) {
  return (
    <Link href={`shop/${card.slug}`} className="block h-full group">
      {/*
        The whole card is a vertical flex column with a fixed height.
        Each section below gets a fixed shape so items in the SAME row
        across different cards line up, regardless of content length:

        - image:       fixed aspect ratio
        - brand:       1 line, fixed height
        - title:       2 lines, fixed height (clamped)
        - description: 2 lines, fixed height (clamped)
        - rating:      1 line, fixed height
        - footer:      pushed to the bottom via mt-auto
      */}
      <Card className="flex h-full flex-col overflow-hidden rounded-lg border border-border/50 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
        {/* Image */}
        <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden border-b border-border/30 bg-background p-3">
          <Image
            src={card.image}
            alt={card.title}
            width={400}
            height={400}
            loading={priority ? "eager" : "lazy"}
            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
          {card.category && (
            <Badge
              variant="secondary"
              className="absolute left-3 top-3 rounded-md px-2 py-1 text-[10px] font-medium"
            >
              {card.category}
            </Badge>
          )}
        </div>

        {/* Content — vertical flex, each row a fixed height so cards align */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          {/* Brand — 1 line */}
          <div className="mb-1 flex h-5 items-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span className="line-clamp-1">{card.brand}</span>
          </div>

          {/* Title — always reserves 2 lines */}
          <h3 className="line-clamp-2 min-h-11 text-[15px] font-semibold leading-5 text-foreground transition-colors group-hover:text-primary">
            {card.title}
          </h3>

          {/* Description — always reserves 2 lines */}
          <p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
            {card.description ?? ""}
          </p>

          {/* Rating — 1 line */}
          <div className="mt-1 flex h-5 items-center gap-1.5 text-sm">
            {card.rating !== null ? (
              <>
                <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                <span className="font-medium text-foreground">
                  {card.rating.toFixed(1)}
                </span>
                <span className="text-muted-foreground">
                  ({card.reviewCount})
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">No reviews yet</span>
            )}
          </div>

          {/* Footer — pushed to bottom with mt-auto so all footers align */}
          <div className="mt-auto flex items-end justify-between gap-2 border-t border-border/40 pt-4">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Price
              </span>
              <span className="text-lg font-bold text-primary">
                EGP{" "}
                {card.price.toLocaleString("en-EG", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            {/* Reserve space even when there are no variants, so the
                price row keeps identical height across cards. */}
            <div className="flex h-6 items-center">
              {card.variantsCount > 1 && (
                <Badge
                  variant="secondary"
                  className="rounded-md px-2 py-1 text-[11px] font-medium"
                >{card.variantsCount} Options</Badge>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
