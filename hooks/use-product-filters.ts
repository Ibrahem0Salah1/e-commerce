"use client";
import { useQueryStates } from "nuqs";
import { filtersParsers } from "../lib/filtersParams";
export function useProductFilters() {
  return useQueryStates(filtersParsers, {
    scroll: true,
  });
}
