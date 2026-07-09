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
import { filtersParsers } from "@/lib/products/filters";
import { useQueryState } from "nuqs";

export function Pagination({
  totalPages,
}: {
  totalPages: number;
}) {
  const [page, setPage] = useQueryState("page", filtersParsers.page);

  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const range = 2;
    const start = Math.max(2, page - range);
    const end = Math.min(totalPages - 1, page + range);

    const result: (number | "ellipsis")[] = [1];
    if (start > 2) result.push("ellipsis");
    for (let i = start; i <= end; i++) result.push(i);
    if (end < totalPages - 1) result.push("ellipsis");
    if (totalPages > 1) result.push(totalPages);

    return result;
  };

  return (
    <PaginationRoot>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (page > 1) void setPage(page - 1);
            }}
            className={page <= 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>

        {getPageNumbers().map((p, i) =>
          p === "ellipsis" ? (
            <PaginationItem key={`e-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                href="#"
                isActive={p === page}
                onClick={(e) => {
                  e.preventDefault();
                  void setPage(p);
                }}
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
              if (page < totalPages) void setPage(page + 1);
            }}
            className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </PaginationRoot>
  );
}
