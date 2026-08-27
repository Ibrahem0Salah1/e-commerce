import {
  createSearchParamsCache,
  inferParserType,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

export const filtersParsers = {
  q: parseAsString.withDefault("").withOptions({
    clearOnDefault: true,
    scroll: false,
  }),
  category: parseAsString.withDefault("").withOptions({
    clearOnDefault: true,
    scroll: false,
  }),
  family: parseAsString.withDefault("").withOptions({
    clearOnDefault: true,
    scroll: false,
  }),
  brand: parseAsString.withDefault("").withOptions({
    clearOnDefault: true,
    scroll: false,
  }),
  featured: parseAsBoolean.withDefault(false).withOptions({
    clearOnDefault: true,
    scroll: false,
  }),
  bestSeller: parseAsBoolean.withDefault(false).withOptions({
    clearOnDefault: true,
    scroll: false,
  }),
  inStock: parseAsBoolean.withDefault(false).withOptions({
    clearOnDefault: true,
    scroll: false,
  }),
  outOfStock: parseAsBoolean.withDefault(false).withOptions({
    clearOnDefault: true,
    scroll: false,
  }),
  lowStock: parseAsBoolean.withDefault(false).withOptions({
    clearOnDefault: true,
    scroll: false,
  }),
  sort: parseAsStringEnum([
    "price_asc",
    "price_desc",
    "name",
    "newest",
    "stock_asc",  
    "stock_desc",
  ]).withDefault("name"),
  page: parseAsInteger
    .withDefault(1)
    .withOptions({ clearOnDefault: true, scroll: true }),
  limit: parseAsInteger
    .withDefault(20)
    .withOptions({ clearOnDefault: true, scroll: true }),
};

export const searchParamsCache = createSearchParamsCache(filtersParsers);

export type ProductFilters = inferParserType<typeof filtersParsers>;
