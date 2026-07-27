"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { ZoomIn } from "lucide-react";

export function ImageGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  if (images.length === 0) return null;

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4 lg:sticky lg:top-24 lg:self-start">
      {/* Thumbnails */}
      <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible md:w-20 shrink-0 pb-1 md:pb-0">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => {
              setActive(i);
              setZoomed(false);
            }}
            className={cn(
              "relative w-16 md:w-20 h-16 md:h-20 rounded-lg border-2 overflow-hidden bg-muted flex-shrink-0 transition-colors",
              active === i
                ? "border-primary"
                : "border-transparent hover:border-border"
            )}
          >
            <Image
              src={img}
              alt={`${name} view ${i + 1}`}
              fill
              className="object-contain p-2"
              sizes="80px"
            />
          </button>
        ))}
      </div>

      {/* Main Stage */}
      <div className="relative flex-grow bg-muted/30 rounded-xl border border-border/50 aspect-square md:aspect-auto md:h-[500px] lg:h-[600px] flex items-center justify-center p-6 group overflow-hidden">
        <button
          onClick={() => setZoomed(!zoomed)}
          className="absolute top-4 right-4 p-2 rounded-full bg-background/90 border border-border/50 text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          <ZoomIn className="h-4 w-4" />
        </button>

        <Image
          src={images[active]}
          alt={name}
          fill
          className={cn(
            "object-contain transition-transform duration-300",
            zoomed ? "scale-125 cursor-zoom-out" : "scale-100 cursor-zoom-in"
          )}
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>
    </div>
  );
}