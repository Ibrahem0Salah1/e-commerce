"use client";

import {
  Pagination as PaginationRoot,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useOrdersFilters } from "@/hooks/useOrdersFilters";

function getPageNumbers(page: number, totalPages: number): (number | "ellipsis")[] {
  const range = 2;
  const start = Math.max(2, page - range);
  const end = Math.min(totalPages - 1, page + range);

  const result: (number | "ellipsis")[] = [1];
  if (start > 2) result.push("ellipsis");
  for (let i = start; i <= end; i++) result.push(i);
  if (end < totalPages - 1) result.push("ellipsis");
  if (totalPages > 1) result.push(totalPages);

  return result;
}

/**
 * URL-param pagination for the admin orders page, built on the shared
 * ui/pagination primitives.
 */
export function OrdersPagination({ totalPages }: { totalPages: number }) {
  const [filters, setFilters] = useOrdersFilters();
  const page = filters.page;

  if (totalPages <= 1) return null;

  const goToPage = (p: number) => {
    setFilters({ page: p === 1 ? null : p });
  };

  return (
    <PaginationRoot>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (page > 1) goToPage(page - 1);
            }}
            className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>

        {getPageNumbers(page, totalPages).map((p, i) =>
          p === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                href="#"
                isActive={p === page}
                onClick={(e) => {
                  e.preventDefault();
                  goToPage(p);
                }}
                className="cursor-pointer"
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (page < totalPages) goToPage(page + 1);
            }}
            className={
              page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
            }
          />
        </PaginationItem>
      </PaginationContent>
    </PaginationRoot>
  );
}
