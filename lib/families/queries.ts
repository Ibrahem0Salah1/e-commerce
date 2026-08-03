import prisma from "@/lib/config/prisma";
import { plain } from "@/lib/utils/serialize";
import { familyListSelect, familyDetailSelect } from "./selects";
import type { FamilyListItem, FamilyDetail } from "./types";

export type { FamilyListItem, FamilyDetail };

export async function getFamiliesByCategory(
  categorySlug: string
): Promise<FamilyListItem[]> {
  const families = await prisma.productFamily.findMany({
    where: { category: { slug: categorySlug } },
    orderBy: { name: "asc" },
    select: familyListSelect,
  });
  return plain(families);
}

export async function getFamilyBySlug(
  familySlug: string
): Promise<FamilyDetail | null> {
  const family = await prisma.productFamily.findUnique({
    where: { slug: familySlug },
    select: familyDetailSelect,
  });
  return plain(family);
}
