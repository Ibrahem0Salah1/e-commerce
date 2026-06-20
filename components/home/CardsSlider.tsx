import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export interface CardData {
  id: number;
  title: string;
  description: string;
  category: string;
  image: string;
  slug: string;
  author: {
    name: string;
    avatar: string;
  };
  date: string;
  readTime: string;
}

export function CardsSlider({ cards }: { cards: CardData[] }) {
  return (
    <Carousel
      opts={{ align: "start", dragFree: true }}
      className="group/slider w-full"
    >
      <CarouselContent className="-ml-4 py-6 sm:-ml-6">
        {cards.map((card, i) => (
          <CarouselItem
            key={card.id}
            className="basis-[75%] pl-4 sm:basis-[45%] sm:pl-6 lg:basis-[30%]"
          >
            <CardItem card={card} priority={i < 2} />
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className="left-2 hidden opacity-0 transition-opacity duration-200 group-hover/slider:opacity-100 lg:flex" />
      <CarouselNext className="right-2 hidden opacity-0 transition-opacity duration-200 group-hover/slider:opacity-100 lg:flex" />
    </Carousel>
  );
}

function CardItem({ card, priority }: { card: CardData; priority?: boolean }) {
  return (
    <Link href={`/shop/${card.slug}`} className="group block h-full [transform:translateZ(0)]">
      <Card className="h-full overflow-hidden rounded-3xl border-border bg-card transition-[border-color,box-shadow] duration-300 hover:border-primary/50 hover:shadow-xl">
        <div className="flex h-full flex-col">
          <div className="relative h-48 shrink-0 overflow-hidden bg-secondary/40">
            <Image
              src={card.image || "/placeholder-product.png"}
              alt={card.title}
              fill
              priority={priority}
              loading={priority ? undefined : "lazy"}
              className="object-cover transition-transform duration-500 will-change-transform group-hover:scale-105"
              sizes="(max-width: 640px) 75vw, (max-width: 1024px) 45vw, 320px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            <div className="absolute left-4 top-4">
              <Badge variant="secondary" className="bg-card/90 px-3 py-1 text-xs font-medium backdrop-blur-md">
                {card.category}
              </Badge>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col p-6">
            <div className="flex-1 space-y-3">
              <h3 className="line-clamp-2 text-xl font-semibold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary">
                {card.title}
              </h3>
              <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {card.description}
              </p>
            </div>

            <div className="mt-auto flex shrink-0 items-center justify-between border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={card.author.avatar} alt={card.author.name} />
                  <AvatarFallback>{card.author.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground">{card.author.name}</span>
                </div>
              </div>
              <div className="bg-secondary/60   rounded-full px-2 py-1 text-xs font-medium text-muted-foreground">
                <p className="w-full">{card.readTime}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}