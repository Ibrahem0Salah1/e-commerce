"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ProductCard, type ProductListItem } from "@/components/products/ProductCard";
import { CategoryCard } from "@/components/categories/CategoryCard";
import { BrandCard } from "@/components/brands/BrandCard";
import type { CategoryListItem } from "@/lib/categories/queries";
import type { BrandListItem } from "@/lib/brands/queries";

interface CardsSliderProps {
  products?: ProductListItem[];
  items?: any[];
  variant?: "product" | "category" | "brand";
  cardClassName?: string;
}

export function CardsSlider({
  products,
  items: itemsProp,
  variant = "product",
  cardClassName,
}: CardsSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Fallback to products if items is not provided
  const items: any[] = itemsProp ?? products ?? [];

  // Determine default card width based on variant
  const defaultCardWidth =
    variant === "product"
      ? "w-65 sm:w-70 lg:w-75"
      : "w-44 sm:w-52 lg:w-56";

  const activeCardClassName = cardClassName ?? defaultCardWidth;

  /* ── Calculate pages based on actual layout ── */
  const calculatePages = useCallback(() => {
    const scrollEl = scrollRef.current;
    const containerEl = containerRef.current;
    if (!scrollEl || !containerEl) return;

    const firstCard = scrollEl.firstElementChild as HTMLElement | null;
    if (!firstCard) return;

    const containerWidth = containerEl.clientWidth;
    const cardWidth = firstCard.offsetWidth;
    const gap = 16; // gap-4 = 16px
    const cardsPerView = Math.max(1, Math.floor(containerWidth / (cardWidth + gap)));
    const pages = Math.max(1, Math.ceil(items.length / cardsPerView));

    setTotalPages(pages);

    // Derive current page from scroll position
    const maxScroll = scrollEl.scrollWidth - containerWidth;
    if (maxScroll <= 0) {
      setPage(0);
      return;
    }
    const pageWidth = cardsPerView * (cardWidth + gap);
    const currentPage = Math.round(scrollEl.scrollLeft / pageWidth);
    setPage(Math.min(currentPage, pages - 1));
  }, [items.length]);

  useEffect(() => {
    calculatePages();

    const ro = new ResizeObserver(calculatePages);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", calculatePages);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", calculatePages);
    };
  }, [calculatePages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => calculatePages();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [calculatePages]);

  /* ── Scroll to a specific page ── */
  const scrollToPage = useCallback(
    (pageIndex: number) => {
      const scrollEl = scrollRef.current;
      const containerEl = containerRef.current;
      if (!scrollEl || !containerEl) return;

      const firstCard = scrollEl.firstElementChild as HTMLElement | null;
      if (!firstCard) return;

      const cardWidth = firstCard.offsetWidth;
      const gap = 16;
      const containerWidth = containerEl.clientWidth;
      const cardsPerView = Math.max(
        1,
        Math.floor(containerWidth / (cardWidth + gap))
      );

      const targetScroll = pageIndex * cardsPerView * (cardWidth + gap);
      scrollEl.scrollTo({ left: targetScroll, behavior: "smooth" });
    },
    []
  );

  const scroll = useCallback(
    (dir: "left" | "right") => {
      const next =
        dir === "left"
          ? Math.max(0, page - 1)
          : Math.min(totalPages - 1, page + 1);
      scrollToPage(next);
    },
    [page, totalPages, scrollToPage]
  );

  if (items.length === 0) return null;

  return (
    <div ref={containerRef} className="relative  group/slider">
      {/* ── Scroll track ── */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pt-1 px-1 -mx-1"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {items.map((item, i) => {
          const key = item.id ?? item.slug ?? i;

          return (
            <div
              key={key}
              className={cn("snap-start shrink-0 py-4", activeCardClassName)}
              style={{ contentVisibility: "auto" }}
            >
              {variant === "category" ? (
                <CategoryCard category={item as CategoryListItem} priority={i < 4} />
              ) : variant === "brand" ? (
                <BrandCard brand={item as BrandListItem} priority={i < 4} />
              ) : (
                <ProductCard product={item as ProductListItem} priority={i < 2} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Prev / Next arrows (desktop only) ── */}
      <button
        onClick={() => scroll("left")}
        className={cn(
          "absolute left-0 top-[calc(50%-20px)] -translate-y-1/2 -translate-x-3 hidden lg:flex h-9 w-9 items-center justify-center rounded-full bg-background/95 border border-border/60 text-foreground shadow-sm transition-opacity duration-200",
          "opacity-0 group-hover/slider:opacity-100",
          page === 0 && "pointer-events-none opacity-0"
        )}
        aria-label="Previous products"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <button
        onClick={() => scroll("right")}
        className={cn(
          "absolute right-0 top-[calc(50%-20px)] -translate-y-1/2 translate-x-3 hidden lg:flex h-9 w-9 items-center justify-center rounded-full bg-background/95 border border-border/60 text-foreground shadow-sm transition-opacity duration-200",
          "opacity-0 group-hover/slider:opacity-100",
          page === totalPages - 1 && "pointer-events-none opacity-0"
        )}
        aria-label="Next products"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* ── Pagination dots ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-1">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToPage(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 ease-out",
                i === page
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-border hover:bg-muted-foreground/50"
              )}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}