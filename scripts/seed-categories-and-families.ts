/**
 * Seed categories and product families from Excel data.
 *
 * DELETE-AND-REPLACE approach:
 *   1. Pre-flight DB state check
 *   2. Move all products → "Restorative & Esthetics", delete ALL old categories + families
 *   3. Create 10 fresh categories from Excel
 *   4. Create ~124 product families from Excel
 *   5. Map restorative products → Excel families (keywords + product-family-mapping.json)
 *   6. Verification
 *
 * Usage:
 *   npx tsx scripts/seed-categories-and-families.ts --dry-run   (preview only)
 *   npx tsx scripts/seed-categories-and-families.ts             (execute)
 */

import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry-run");

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ExcelCategory {
  name: string;
}

interface ExcelFamily {
  categoryName: string;
  name: string;
}

interface MappingEntry {
  productSlug: string;
  productName: string;
  categoryName: string;
  familyName: string;
  confidence: string;
  reasoning: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Excel Data — exact names, typo fixes only
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES: ExcelCategory[] = [
  { name: "Periodontics" },
  { name: "Sterilization Material" },        // typo fix: was "sterlization material"
  { name: "Pedodontics" },
  { name: "Restorative & Esthetics" },
  { name: "Fixed&Removable Prosthodontics" }, // kept as-is per user request
  { name: "Lab Materials" },
  { name: "Oral Surgery" },
  { name: "Endodontics" },
  { name: "Disposable Supplies" },
  { name: "Orthodontics" },
];

const FAMILIES: ExcelFamily[] = [
  // ── Periodontics ──────────────────────────────────────────────────────────
  { categoryName: "Periodontics", name: "Periotome" },
  { categoryName: "Periodontics", name: "Curettes" },
  { categoryName: "Periodontics", name: "Periodontal Probes" },
  { categoryName: "Periodontics", name: "Scalers" },
  { categoryName: "Periodontics", name: "Handpiece for Ultrasonic Scaler" },
  { categoryName: "Periodontics", name: "Ultrasonic Scaler Tips" },

  // ── Sterilization Material ────────────────────────────────────────────────
  { categoryName: "Sterilization Material", name: "Chemical Indicators" },
  { categoryName: "Sterilization Material", name: "Sterilization Pouch" },
  { categoryName: "Sterilization Material", name: "Sleeves" },
  { categoryName: "Sterilization Material", name: "Disinfection" },
  { categoryName: "Sterilization Material", name: "Sterilization Roll" },
  { categoryName: "Sterilization Material", name: "Barrier Film (Wrapping)" },

  // ── Pedodontics ───────────────────────────────────────────────────────────
  { categoryName: "Pedodontics", name: "Syringe Sleeve for Pedo" },
  { categoryName: "Pedodontics", name: "Zirconia Crowns" },
  { categoryName: "Pedodontics", name: "Space Maintainers" },
  { categoryName: "Pedodontics", name: "Pit & Fissure Sealant" },
  { categoryName: "Pedodontics", name: "Zinc Oxide Eugenol" },
  { categoryName: "Pedodontics", name: "Clamps" },
  { categoryName: "Pedodontics", name: "Stainless Steel Crowns" },
  { categoryName: "Pedodontics", name: "Children Extraction Forceps" },
  { categoryName: "Pedodontics", name: "Fluoride Varnish" },
  { categoryName: "Pedodontics", name: "Silver Diamine Fluoride (SDF)" },
  { categoryName: "Pedodontics", name: "Formocresol" },

  // ── Restorative & Esthetics ───────────────────────────────────────────────
  { categoryName: "Restorative & Esthetics", name: "Clamps" },
  { categoryName: "Restorative & Esthetics", name: "Rubber Dam" },
  { categoryName: "Restorative & Esthetics", name: "Composite" },
  { categoryName: "Restorative & Esthetics", name: "Bond Brush Applicators" },
  { categoryName: "Restorative & Esthetics", name: "Bond" },

  // ── Fixed&Removable Prosthodontics ────────────────────────────────────────
  { categoryName: "Fixed&Removable Prosthodontics", name: "Garant Dispenser" },
  { categoryName: "Fixed&Removable Prosthodontics", name: "Acrylic Material Acrostone" },
  { categoryName: "Fixed&Removable Prosthodontics", name: "Crown Remover" },
  { categoryName: "Fixed&Removable Prosthodontics", name: "Post" },
  { categoryName: "Fixed&Removable Prosthodontics", name: "Trays" },
  { categoryName: "Fixed&Removable Prosthodontics", name: "Etch Porcelain Hydrofluoric Acid" },
  { categoryName: "Fixed&Removable Prosthodontics", name: "Impression Compound" },
  { categoryName: "Fixed&Removable Prosthodontics", name: "Drills" },
  { categoryName: "Fixed&Removable Prosthodontics", name: "Alginate" },
  { categoryName: "Fixed&Removable Prosthodontics", name: "Torch" },
  { categoryName: "Fixed&Removable Prosthodontics", name: "Rubber Bowl" },
  { categoryName: "Fixed&Removable Prosthodontics", name: "Putty" },
  { categoryName: "Fixed&Removable Prosthodontics", name: "Temporary Crown" },
  { categoryName: "Fixed&Removable Prosthodontics", name: "Silaxil" },
  { categoryName: "Fixed&Removable Prosthodontics", name: "Capsule Applier" },
  { categoryName: "Fixed&Removable Prosthodontics", name: "Tips" },
  { categoryName: "Fixed&Removable Prosthodontics", name: "Guns" },
  { categoryName: "Fixed&Removable Prosthodontics", name: "Light" },

  // ── Oral Surgery ──────────────────────────────────────────────────────────
  { categoryName: "Oral Surgery", name: "Elevators" },
  { categoryName: "Oral Surgery", name: "Tweezers" },
  { categoryName: "Oral Surgery", name: "Scalpel Handle" },
  { categoryName: "Oral Surgery", name: "Blades & Circular Knives" },
  { categoryName: "Oral Surgery", name: "Mosquito Forceps" },
  { categoryName: "Oral Surgery", name: "Forceps" },
  { categoryName: "Oral Surgery", name: "Scissors" },
  { categoryName: "Oral Surgery", name: "Sutures" },
  { categoryName: "Oral Surgery", name: "Alvogyl" },
  { categoryName: "Oral Surgery", name: "Sinus Lift Curette" },
  { categoryName: "Oral Surgery", name: "Kocher Forceps" },
  { categoryName: "Oral Surgery", name: "Needle Holder" },
  { categoryName: "Oral Surgery", name: "Bone Curette" },
  { categoryName: "Oral Surgery", name: "Bone Graft Holding Forceps" },
  { categoryName: "Oral Surgery", name: "Mallet & Chisels" },
  { categoryName: "Oral Surgery", name: "Weider Tongue Depressor" },
  { categoryName: "Oral Surgery", name: "Stieglitz Root Splinter Forceps" },

  // ── Endodontics ───────────────────────────────────────────────────────────
  { categoryName: "Endodontics", name: "Endobox" },
  { categoryName: "Endodontics", name: "Metapaste & Metapex" },
  { categoryName: "Endodontics", name: "Sealer" },
  { categoryName: "Endodontics", name: "H-Files" },
  { categoryName: "Endodontics", name: "Rubber Dam" },
  { categoryName: "Endodontics", name: "Rotary Files" },
  { categoryName: "Endodontics", name: "Irrigation Tip & Needle & Activation" },
  { categoryName: "Endodontics", name: "Lip Hook & File Clip" },
  { categoryName: "Endodontics", name: "C-Files" },
  { categoryName: "Endodontics", name: "MTA" },
  { categoryName: "Endodontics", name: "Sodium Hypochlorite 5%" },
  { categoryName: "Endodontics", name: "K-Files" },
  { categoryName: "Endodontics", name: "GP Taper 2" },
  { categoryName: "Endodontics", name: "Paper Point" },
  { categoryName: "Endodontics", name: "GP Solvent" },
  { categoryName: "Endodontics", name: "D Finder" },
  { categoryName: "Endodontics", name: "Endodontic Probe" },
  { categoryName: "Endodontics", name: "Apex Locator" },
  { categoryName: "Endodontics", name: "Air Scaler" },
  { categoryName: "Endodontics", name: "Chlorhexidine Solution 2%" },
  { categoryName: "Endodontics", name: "Spreader" },
  { categoryName: "Endodontics", name: "GP" },                       // trimmed trailing space from "GP "
  { categoryName: "Endodontics", name: "Temp Filling" },
  { categoryName: "Endodontics", name: "EDTA" },
  { categoryName: "Endodontics", name: "Endodontic Ruler" },
  { categoryName: "Endodontics", name: "Dental Plugger" },
  { categoryName: "Endodontics", name: "Endo Assistant" },

  // ── Disposable Supplies ───────────────────────────────────────────────────
  { categoryName: "Disposable Supplies", name: "Single Use Instruments" },
  { categoryName: "Disposable Supplies", name: "Over Gloves" },
  { categoryName: "Disposable Supplies", name: "Air Water Tip" },
  { categoryName: "Disposable Supplies", name: "Metal Tray" },
  { categoryName: "Disposable Supplies", name: "Gown" },
  { categoryName: "Disposable Supplies", name: "Cotton" },            // deduped from Cotton/Cottons
  { categoryName: "Disposable Supplies", name: "Bib Sheets" },
  { categoryName: "Disposable Supplies", name: "Gloves" },            // deduped from Glovess/Gloves
  { categoryName: "Disposable Supplies", name: "Suction" },
  { categoryName: "Disposable Supplies", name: "Disposable Caries Indicator" },
  { categoryName: "Disposable Supplies", name: "Shoe Covers" },
  { categoryName: "Disposable Supplies", name: "Head Cover" },
  { categoryName: "Disposable Supplies", name: "Face Shield" },
  { categoryName: "Disposable Supplies", name: "Tip" },
  { categoryName: "Disposable Supplies", name: "Over Head" },
  { categoryName: "Disposable Supplies", name: "Face Mask" },         // deduped from Face Mask/face-masks
  { categoryName: "Disposable Supplies", name: "Pouches" },
  { categoryName: "Disposable Supplies", name: "Wrapping" },
  { categoryName: "Disposable Supplies", name: "Napkin" },            // deduped from Napkin/Napkins
  { categoryName: "Disposable Supplies", name: "Air Tip" },
  { categoryName: "Disposable Supplies", name: "Cups" },
  { categoryName: "Disposable Supplies", name: "Syringe" },
  { categoryName: "Disposable Supplies", name: "Saliva Ejector" },

  // ── Orthodontics ──────────────────────────────────────────────────────────
  { categoryName: "Orthodontics", name: "Buccal Tubes" },
  { categoryName: "Orthodontics", name: "Band Remover" },
  { categoryName: "Orthodontics", name: "Head Gear" },
  { categoryName: "Orthodontics", name: "Brackets" },
  { categoryName: "Orthodontics", name: "Separating Plier" },
  { categoryName: "Orthodontics", name: "Molar Bands" },
  { categoryName: "Orthodontics", name: "Orthodontic Pliers" },
  { categoryName: "Orthodontics", name: "Orthodontic Lingual Retainer" },
  { categoryName: "Orthodontics", name: "Power Chain" },
  { categoryName: "Orthodontics", name: "Orthodontic Elastic" },
  { categoryName: "Orthodontics", name: "Face Bow" },
  { categoryName: "Orthodontics", name: "Coil Spring" },
  { categoryName: "Orthodontics", name: "Orthodontic Hook" },
  { categoryName: "Orthodontics", name: "Tweezers" },                // slug will differ from Oral Surgery via collision handling
  { categoryName: "Orthodontics", name: "Orthodontic Cutter" },
  { categoryName: "Orthodontics", name: "O-Tie" },
  { categoryName: "Orthodontics", name: "Orthodontic Screw" },
  { categoryName: "Orthodontics", name: "Bracket Placer" },
  { categoryName: "Orthodontics", name: "Orthodontic Face Mask" },
  { categoryName: "Orthodontics", name: "Band Pusher" },
  { categoryName: "Orthodontics", name: "Arch Wire" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

/**
 * Generate a unique slug. Tracks all used slugs globally.
 * If collision, appends -2, -3, etc.
 */
function uniqueSlug(
  base: string,
  used: Map<string, number>,
): string {
  const candidate = base || "unnamed";
  const count = used.get(candidate) ?? 0;
  used.set(candidate, count + 1);
  return count === 0 ? candidate : `${candidate}-${count + 1}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 1: Pre-flight
// ─────────────────────────────────────────────────────────────────────────────

async function phase1PreFlight() {
  console.log("\n=== Phase 1: Pre-flight DB State ===\n");

  if (DRY_RUN) console.log("⚠️  DRY RUN MODE — no DB writes\n");

  const [categoryCount, familyCount, productCount] = await Promise.all([
    prisma.category.count(),
    prisma.productFamily.count(),
    prisma.product.count(),
  ]);

  console.log(`  Categories:       ${categoryCount}`);
  console.log(`  Product Families: ${familyCount}`);
  console.log(`  Products:         ${productCount}`);

  const categories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  console.log("\n  Existing categories:");
  for (const c of categories) {
    const fams = await prisma.productFamily.count({ where: { categoryId: c.id } });
    const prods = await prisma.product.count({ where: { categoryId: c.id } });
    console.log(`    ${c.name} (${c.slug}) — ${fams} families, ${prods} products`);
  }

  console.log("\n=== Phase 1 complete ===");
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2: Move products + clear old data
// ─────────────────────────────────────────────────────────────────────────────

async function phase2ClearOldData(): Promise<void> {
  console.log("\n=== Phase 2: Move Products + Clear Old Categories & Families ===\n");

  const allCategories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true },
  });

  // Find or create "Restorative & Esthetics"
  const targetSlug = slugify("Restorative & Esthetics");
  let target = allCategories.find((c) => c.slug === targetSlug);

  if (!target) {
    if (DRY_RUN) {
      console.log('  [dry-run] Would create temporary "Restorative & Esthetics" category');
      target = { id: "dry-run-restorative-esthetics", name: "Restorative & Esthetics", slug: targetSlug };
    } else {
      target = await prisma.category.create({
        data: { name: "Restorative & Esthetics", slug: targetSlug },
      });
      console.log('  ✔ Created "Restorative & Esthetics"');
    }
  } else {
    console.log(`  ✓ "Restorative & Esthetics" already exists (${target.id})`);
  }

  // Move ALL products that aren't already under the target → to the target
  const productsToMove = await prisma.product.count({
    where: { categoryId: { not: target.id } },
  });

  if (productsToMove > 0) {
    if (DRY_RUN) {
      console.log(`  [dry-run] Would move ${productsToMove} products → "Restorative & Esthetics"`);
    } else {
      await prisma.product.updateMany({
        where: { categoryId: { not: target.id } },
        data: { categoryId: target.id },
      });
      console.log(`  ✔ Moved ${productsToMove} products → "Restorative & Esthetics"`);
    }
  } else {
    console.log("  ✓ All products already under target category");
  }

  // Delete ALL families (they'll be recreated in Phase 4)
  const familyDeleteCount = await prisma.productFamily.count();
  if (familyDeleteCount > 0) {
    if (DRY_RUN) {
      console.log(`  [dry-run] Would delete ${familyDeleteCount} families`);
    } else {
      await prisma.productFamily.deleteMany({});
      console.log(`  ✔ Deleted ${familyDeleteCount} families`);
    }
  }

  // Delete ALL categories EXCEPT the target
  const categoriesToDelete = allCategories.filter((c) => c.id !== target!.id);
  if (categoriesToDelete.length > 0) {
    if (DRY_RUN) {
      console.log(`  [dry-run] Would delete ${categoriesToDelete.length} old categories:`);
      for (const c of categoriesToDelete) {
        console.log(`    ${c.name} (${c.slug})`);
      }
    } else {
      await prisma.category.deleteMany({
        where: { id: { not: target.id } },
      });
      console.log(`  ✔ Deleted ${categoriesToDelete.length} old categories`);
    }
  }

  console.log("\n=== Phase 2 complete ===");
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3: Create categories from Excel
// ─────────────────────────────────────────────────────────────────────────────

interface CategoryWithId extends ExcelCategory {
  id: string;
  slug: string;
}

async function phase3CreateCategories(): Promise<CategoryWithId[]> {
  console.log("\n=== Phase 3: Create Categories from Excel ===\n");

  const slugTracker = new Map<string, number>();
  const created: CategoryWithId[] = [];

  // Pre-seed tracker with slugs already in DB (e.g., "Restorative & Esthetics" kept from Phase 2)
  const existing = await prisma.category.findMany({ select: { id: true, name: true, slug: true } });
  for (const c of existing) {
    slugTracker.set(c.slug, (slugTracker.get(c.slug) ?? 0) + 1);
  }

  for (const cat of CATEGORIES) {
    const baseSlug = slugify(cat.name);

    // Check if a category with this slug already exists → reuse it
    const existingMatch = existing.find((e) => e.slug === baseSlug || e.name === cat.name);
    if (existingMatch) {
      created.push({ ...cat, id: existingMatch.id, slug: existingMatch.slug });
      console.log(`  ✓ Reusing existing "${cat.name}" (${existingMatch.slug})`);
      continue;
    }

    const slug = uniqueSlug(baseSlug, slugTracker);

    if (DRY_RUN) {
      const fakeId = `dry-run-${slug}`;
      created.push({ ...cat, id: fakeId, slug });
      console.log(`  [dry-run] Would create "${cat.name}" (${slug})`);
    } else {
      const record = await prisma.category.create({
        data: { name: cat.name, slug },
      });
      created.push({ ...cat, id: record.id, slug: record.slug });
      console.log(`  ✔ Created "${cat.name}" (${record.slug})`);
    }
  }

  console.log(`\n  ${created.length} categories ready`);
  console.log("\n=== Phase 3 complete ===");
  return created;
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4: Create families from Excel
// ─────────────────────────────────────────────────────────────────────────────

async function phase4CreateFamilies(
  categories: CategoryWithId[],
): Promise<Map<string, string>> {
  console.log("\n=== Phase 4: Create Families from Excel ===\n");

  // Build categoryName → categoryId lookup
  const catMap = new Map<string, string>();
  for (const c of categories) {
    catMap.set(c.name, c.id);
  }

  const slugTracker = new Map<string, number>();
  const familySlugToId = new Map<string, string>();
  let created = 0;
  let skipped = 0;

  for (const fam of FAMILIES) {
    const categoryId = catMap.get(fam.categoryName);
    if (!categoryId) {
      console.log(`  ⚠️  Category "${fam.categoryName}" not found for "${fam.name}" — skipping`);
      skipped++;
      continue;
    }

    const slug = uniqueSlug(slugify(fam.name), slugTracker);

    if (DRY_RUN) {
      const fakeId = `dry-run-${slug}`;
      familySlugToId.set(slug, fakeId);
      console.log(`  [dry-run] Would create "${fam.name}" (${slug}) under ${fam.categoryName}`);
    } else {
      const record = await prisma.productFamily.create({
        data: { name: fam.name, slug, categoryId },
      });
      familySlugToId.set(slug, record.id);
      console.log(`  ✔ "${fam.name}" (${record.slug}) → ${fam.categoryName}`);
    }
    created++;
  }

  console.log(`\n  ${created} families created, ${skipped} skipped`);

  // Summary by category
  const byCategory = new Map<string, number>();
  for (const fam of FAMILIES) {
    byCategory.set(fam.categoryName, (byCategory.get(fam.categoryName) ?? 0) + 1);
  }
  console.log("  Families per category:");
  for (const [name, count] of byCategory) {
    console.log(`    ${name}: ${count}`);
  }

  console.log("\n=== Phase 4 complete ===");
  return familySlugToId;
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 5: Map restorative products → families
// ─────────────────────────────────────────────────────────────────────────────

interface FamilyRule {
  familySlug: string;
  nameKeywords: string[];
  descKeywords: string[];
}

const RESTORATIVE_FAMILY_RULES: FamilyRule[] = [
  {
    familySlug: "bond-brush-applicators",
    nameKeywords: ["bond brush", "applicator brush", "brush applicator"],
    descKeywords: [],
  },
  {
    familySlug: "clamps",
    nameKeywords: ["clamp"],
    descKeywords: ["rubber dam clamp"],
  },
  {
    familySlug: "rubber-dam",
    nameKeywords: [
      "rubber dam", "dam sheet", "dam kit", "flexdam",
      "gingiva barrier", "isolation",
    ],
    descKeywords: ["rubber dam", "dam sheet", "dam kit", "isolation material"],
  },
  {
    familySlug: "bond",
    nameKeywords: [
      "etch", "bond", "bonding", "adhesive", "primer", "etchant",
      "self-etch", "total-etch", "phosphoric acid", "desensitizer",
      "sealant", "varnish", "gluma",
    ],
    descKeywords: [
      "etch", "bond", "bonding", "adhesive", "primer", "self-etch",
      "total-etch", "phosphoric acid", "desensitizer",
    ],
  },
  {
    familySlug: "composite",
    nameKeywords: [
      "composite", "resin", "giomer", "compomer", "glass ionomer",
      "ionomer", "cement", "base", "liner", "lining", "temporary",
      "temp", "filling", "amalgam", "flowable", "bulk fill", "packable",
      "restorative", "core build", "luting", "cavit", "zoe", "IRM",
      "GIC", "fuji", "spectra", "charisma", "charmf", "haps", "aegis",
      "beautifil", "estelite", "filtek", "tetric", "ceram",
      "hemostatic", "retraction", "clove", "eugenol",
      // Expanded: restorative-adjacent products
      "matrix", "band", "wedge",
      "light cure", "curing light", "led light",
      "polishing", "finishing",
      "carving", "carver",
      "bleach", "bleaching", "whitening",
      "articulating", "articulation",
      "etchant", "etch",
    ],
    descKeywords: [
      "composite", "resin", "glass ionomer", "ionomer", "cement",
      "base", "liner", "temporary", "filling", "amalgam", "flowable",
      "restorative", "matrix", "wedge", "light cure", "curing light",
      "polishing", "finishing", "bleaching", "whitening",
    ],
  },
];

/**
 * AI mapping: convert the 13 families from product-family-mapping.json
 * into the 5 Excel families. Used as a fallback when keyword matching fails.
 */
const MAPPING_FAMILY_TO_EXCEL: Record<string, string> = {
  "Acid Etch & Bonding Agents": "bond",
  "Amalgam": "composite",
  "Composite": "composite",
  "Glass Ionomer / Cement & Base Liner": "composite",
  "Temporary Fillings": "composite",
  "Whitening": "composite",
  "Isolation Material": "rubber-dam",
  "Matrix Materials & Wedges": "composite",
  "Light Curing Devices": "composite",
  "Finishing & Polishing": "composite",
  "Instruments": "composite",
  "Accessories": "composite",
  "Articulating Products": "composite",
};

function matchProductToFamily(
  name: string,
  description: string[],
  mappingFallback: string | null,
): string | null {
  const descText = description.join(" ");

  // 1. Try keyword matching (most specific first)
  for (const rule of RESTORATIVE_FAMILY_RULES) {
    if (containsAny(name, rule.nameKeywords)) {
      return rule.familySlug;
    }
    if (rule.descKeywords.length > 0 && containsAny(descText, rule.descKeywords)) {
      return rule.familySlug;
    }
  }

  // 2. Fallback: use product-family-mapping.json cross-reference
  if (mappingFallback) {
    const excelFamily = MAPPING_FAMILY_TO_EXCEL[mappingFallback];
    if (excelFamily) return excelFamily;
  }

  return null;
}

async function phase5MapProducts(
  restorativeCategoryId: string,
  familySlugToId: Map<string, string>,
): Promise<void> {
  console.log("\n=== Phase 5: Map Restorative Products → Families ===\n");

  // Load the product-family-mapping.json for fallback matching
  const mappingPath = path.resolve(__dirname, "../product-family-mapping.json");
  let mappingData: MappingEntry[] = [];
  if (fs.existsSync(mappingPath)) {
    mappingData = JSON.parse(fs.readFileSync(mappingPath, "utf-8"));
    console.log(`  Loaded ${mappingData.length} entries from product-family-mapping.json`);
  } else {
    console.log("  ⚠️  product-family-mapping.json not found — keyword matching only");
  }

  // Build slug → mapping family lookup
  const slugToMappingFamily = new Map<string, string>();
  for (const entry of mappingData) {
    slugToMappingFamily.set(entry.productSlug, entry.familyName);
  }

  // Fetch all restorative products
  const products = await prisma.product.findMany({
    where: {
      categoryId: restorativeCategoryId,
      familyId: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
    },
  });

  console.log(`  ${products.length} products to map`);

  const stats = {
    mapped: 0,
    unmatched: 0,
    byFamily: new Map<string, number>(),
  };

  const updates: Array<{ productId: string; familyId: string; familySlug: string }> = [];

  for (const product of products) {
    const mappingFallback = slugToMappingFamily.get(product.slug) ?? null;
    const familySlug = matchProductToFamily(product.name, product.description, mappingFallback);

    if (familySlug) {
      const familyId = familySlugToId.get(familySlug);
      if (!familyId) {
        console.log(`  ⚠️  Slug "${familySlug}" not in family map for "${product.name}"`);
        stats.unmatched++;
        continue;
      }

      if (!DRY_RUN) {
        updates.push({ productId: product.id, familyId, familySlug });
      }
      stats.mapped++;
      stats.byFamily.set(familySlug, (stats.byFamily.get(familySlug) ?? 0) + 1);
    } else {
      stats.unmatched++;
    }
  }

  if (DRY_RUN) {
    console.log(`\n  [dry-run] Would update ${updates.length} products:\n`);
    for (const [slug, count] of stats.byFamily) {
      console.log(`    ${slug}: ${count}`);
    }
    console.log(`    (unmatched): ${stats.unmatched}`);
  } else if (updates.length > 0) {
    const BATCH = 100;
    let done = 0;
    for (let i = 0; i < updates.length; i += BATCH) {
      const batch = updates.slice(i, i + BATCH);
      await Promise.all(
        batch.map((u) =>
          prisma.product.update({
            where: { id: u.productId },
            data: { familyId: u.familyId },
          }),
        ),
      );
      done += batch.length;
      if (done % 200 === 0 || done === updates.length) {
        console.log(`  Progress: ${done}/${updates.length}`);
      }
    }
  }

  console.log(`\n  Results: ${stats.mapped} mapped, ${stats.unmatched} unmatched`);
  console.log("  By family:");
  for (const [slug, count] of stats.byFamily) {
    console.log(`    ${slug}: ${count}`);
  }

  console.log("\n=== Phase 5 complete ===");
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 6: Verification
// ─────────────────────────────────────────────────────────────────────────────

async function phase6Verify(restorativeCategoryId: string) {
  console.log("\n=== Phase 6: Verification ===\n");

  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { families: true, products: true } },
    },
    orderBy: { name: "asc" },
  });

  console.log(`  Categories: ${categories.length}`);
  for (const c of categories) {
    console.log(`    ${c.name} (${c.slug}) — ${c._count.families} families, ${c._count.products} products`);
  }

  const totalFamilies = await prisma.productFamily.count();
  console.log(`\n  Total product families: ${totalFamilies}`);

  // Duplicate slug checks
  const famSlugs = await prisma.productFamily.groupBy({
    by: ["slug"],
    _count: { slug: true },
    having: { slug: { _count: { gt: 1 } } },
  });
  console.log(famSlugs.length ? `  ⚠️  ${famSlugs.length} duplicate family slugs` : "  ✓ No duplicate family slugs");

  const catSlugs = await prisma.category.groupBy({
    by: ["slug"],
    _count: { slug: true },
    having: { slug: { _count: { gt: 1 } } },
  });
  console.log(catSlugs.length ? `  ⚠️  ${catSlugs.length} duplicate category slugs` : "  ✓ No duplicate category slugs");

  // Restorative product coverage
  const total = await prisma.product.count({ where: { categoryId: restorativeCategoryId } });
  const withFamily = await prisma.product.count({
    where: { categoryId: restorativeCategoryId, familyId: { not: null } },
  });
  const withoutFamily = total - withFamily;

  console.log(`\n  Restorative & Esthetics products:`);
  console.log(`    Total:       ${total}`);
  console.log(`    With family: ${withFamily} (${total ? Math.round((withFamily / total) * 100) : 0}%)`);
  console.log(`    No family:   ${withoutFamily} (${total ? Math.round((withoutFamily / total) * 100) : 0}%)`);

  const breakdown = await prisma.productFamily.findMany({
    where: { categoryId: restorativeCategoryId },
    select: {
      name: true,
      slug: true,
      _count: { select: { products: true } },
    },
    orderBy: { products: { _count: "desc" } },
  });

  if (breakdown.length > 0) {
    console.log("\n    Products per family:");
    for (const f of breakdown) {
      console.log(`      ${f.name}: ${f._count.products}`);
    }
  }

  // Orphan check
  const orphans = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM product_families pf
    WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.id = pf."categoryId")
  `;
  const orphanCount = Number(orphans[0].count);
  console.log(orphanCount ? `\n  ⚠️  ${orphanCount} orphaned families` : "  ✓ No orphaned families");

  console.log("\n=== Phase 6 complete ===");
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  Seed Categories & Product Families from Excel Data     ║");
  console.log("║  Mode: DELETE-AND-REPLACE                               ║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  if (DRY_RUN) console.log("\n  Mode: DRY RUN (no DB writes)\n");

  await phase1PreFlight();
  await phase2ClearOldData();
  const categories = await phase3CreateCategories();
  const familySlugToId = await phase4CreateFamilies(categories);

  const restorativeCat = categories.find((c) => c.name === "Restorative & Esthetics");
  if (restorativeCat) {
    await phase5MapProducts(restorativeCat.id, familySlugToId);
    await phase6Verify(restorativeCat.id);
  } else {
    console.log("\n  ⚠️  Restorative & Esthetics category not found — skipping Phase 5 & 6");
  }

  console.log("\n✅ All phases complete.\n");
}

main()
  .catch((e) => {
    console.error("\n❌ Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
