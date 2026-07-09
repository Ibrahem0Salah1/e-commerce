"use client";

import { useState } from "react";
import Image from "next/image";

export function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const main = images[selectedIndex] ?? "/placeholder-product.png";
  const allImages = images.slice(0, 5);

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-secondary/40">
        <Image
          src={main}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </div>
      {allImages.length > 1 && (
        <div className="flex gap-3">
          {allImages.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={`relative aspect-square size-20 overflow-hidden rounded-lg bg-secondary/40 ring-1 transition-shadow hover:ring-foreground/30 ${
                i === selectedIndex ? "ring-foreground" : "ring-border"
              }`}
            >
              <Image
                src={src}
                alt={`${name} ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
