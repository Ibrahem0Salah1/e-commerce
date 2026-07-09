"use client";
import { useQueryStates } from "nuqs";
import { filtersParsers } from "../lib/products/filters";
export function useProductFilters() {
  return useQueryStates(filtersParsers, {});
}
