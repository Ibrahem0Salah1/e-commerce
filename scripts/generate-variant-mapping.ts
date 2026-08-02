/**
 * Phase B: Generate variant-to-attribute mapping for review.
 *
 * Reads restorative-dash-2.json, analyzes every product + its variants,
 * and writes variant-attribute-mapping.json for human review.
 *
 * Run: npx tsx scripts/generate-variant-mapping.ts
 */

import fs from "fs";
import path from "path";

// ── Known dental shade codes (VITA classical + common extensions) ──────────
const KNOWN_SHADES = new Set([
  "A1", "A2", "A3", "A3.5", "A4",
  "B1", "B2", "B3", "B4",
  "C1", "C2", "C3", "C4",
  "D1", "D2", "D3", "D4",
  "OB", "OM", "OD", "OL", "OC",
  "BL", "BXL", "BW",
  "Clear", "Transp", "Transparent",
  "Enamel", "Dentin",
  "NE", "ND",
  // Bleach shades
  "BL1", "BL2", "BL3", "BL4",
]);

// ── Known size words ──────────────────────────────────────────────────────
const KNOWN_SIZES = new Set([
  "small", "medium", "large", "xl", "xxl", "xs",
  "extra small", "extra large", "deep caries",
]);

// ── Known color words ─────────────────────────────────────────────────────
const KNOWN_COLORS = new Set([
  "purple", "orange", "yellow", "green", "blue", "red",
  "pink", "white", "black", "brown", "grey", "gray",
  "torquase", "turquoise", "teal", "mint",
]);

interface SeedVariant {
  name: string;
  price: number;
  stock: number;
}

interface SeedProduct {
  name: string;
  slug: string;
  brand: string;
  category: string;
  basePrice: number;
  images: string[];
  variants: SeedVariant[];
  madeIn: string | null;
  description: string[];
  specGroups: any[];
}

interface AttributeAssignment {
  typeName: string;
  typeNameSlug: string;
  valueName: string;
  valueNameSlug: string;
}

interface SingleVariantMapping {
  existingProductSlug: string;
  existingProductName: string;
  variantName: string;
  action: "collapse";
  newPrice: number;
  newStock: number;
  newSku: string | null;
  attributeValues: AttributeAssignment[];
  confidence: "high" | "medium" | "low";
  reasoning: string;
}

interface MultiVariantProductMapping {
  existingProductSlug: string;
  existingProductName: string;
  variants: {
    variantName: string;
    newProductName: string;
    newProductSlug: string;
    price: number;
    stock: number;
    sku: string | null;
    attributeValues: AttributeAssignment[];
    confidence: "high" | "medium" | "low";
    reasoning: string;
  }[];
  inheritedFields: {
    brand: string;
    category: string;
    madeIn: string | null;
    description: string[];
    imageCount: number;
    specGroupCount: number;
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseVariantName(
  name: string
): {
  attributes: AttributeAssignment[];
  confidence: "high" | "medium" | "low";
  reasoning: string;
} {
  const trimmed = name.trim();

  // "Default" = no attributes
  if (trimmed.toLowerCase() === "default") {
    return {
      attributes: [],
      confidence: "high",
      reasoning: "Default variant — no attributes needed, collapse directly",
    };
  }

  // Check if it's a known shade code
  if (KNOWN_SHADES.has(trimmed)) {
    return {
      attributes: [
        {
          typeName: "Shade",
          typeNameSlug: "shade",
          valueName: trimmed,
          valueNameSlug: slugify(trimmed),
        },
      ],
      confidence: "high",
      reasoning: `"${trimmed}" is a recognized dental shade code`,
    };
  }

  // Check for shade with prefix like "Shade A2"
  const shadeMatch = trimmed.match(/^shade\s+(.+)$/i);
  if (shadeMatch && KNOWN_SHADES.has(shadeMatch[1])) {
    return {
      attributes: [
        {
          typeName: "Shade",
          typeNameSlug: "shade",
          valueName: shadeMatch[1],
          valueNameSlug: slugify(shadeMatch[1]),
        },
      ],
      confidence: "high",
      reasoning: `"${trimmed}" has explicit "Shade" prefix with recognized code`,
    };
  }

  // Check for simple size word
  if (KNOWN_SIZES.has(trimmed.toLowerCase())) {
    return {
      attributes: [
        {
          typeName: "Size",
          typeNameSlug: "size",
          valueName: trimmed,
          valueNameSlug: slugify(trimmed),
        },
      ],
      confidence: "high",
      reasoning: `"${trimmed}" is a recognized size word`,
    };
  }

  // Check for comma-separated color+size like "Purple,small"
  if (trimmed.includes(",")) {
    const parts = trimmed.split(",").map((p) => p.trim());
    const attributes: AttributeAssignment[] = [];
    let allKnown = true;

    for (const part of parts) {
      if (KNOWN_COLORS.has(part.toLowerCase())) {
        attributes.push({
          typeName: "Color",
          typeNameSlug: "color",
          valueName: part,
          valueNameSlug: slugify(part),
        });
      } else if (KNOWN_SIZES.has(part.toLowerCase())) {
        attributes.push({
          typeName: "Size",
          typeNameSlug: "size",
          valueName: part,
          valueNameSlug: slugify(part),
        });
      } else if (KNOWN_SHADES.has(part)) {
        attributes.push({
          typeName: "Shade",
          typeNameSlug: "shade",
          valueName: part,
          valueNameSlug: slugify(part),
        });
      } else {
        allKnown = false;
        // Try to guess: if short alphanumeric, might be shade
        if (/^[A-Z]\d/.test(part)) {
          attributes.push({
            typeName: "Shade",
            typeNameSlug: "shade",
            valueName: part,
            valueNameSlug: slugify(part),
          });
        } else {
          attributes.push({
            typeName: "Unit",
            typeNameSlug: "unit",
            valueName: part,
            valueNameSlug: slugify(part),
          });
        }
      }
    }

    if (attributes.length > 0) {
      return {
        attributes,
        confidence: allKnown ? "high" : "medium",
        reasoning: `Comma-separated values: ${parts.join(" + ")}`,
      };
    }
  }

  // Check for multi-word: try to parse each word
  const words = trimmed.split(/\s+/);
  if (words.length > 1) {
    const attributes: AttributeAssignment[] = [];
    let parsedSomething = false;
    let allKnown = true;

    for (const word of words) {
      if (KNOWN_SIZES.has(word.toLowerCase())) {
        attributes.push({
          typeName: "Size",
          typeNameSlug: "size",
          valueName: word,
          valueNameSlug: slugify(word),
        });
        parsedSomething = true;
      } else if (KNOWN_COLORS.has(word.toLowerCase())) {
        attributes.push({
          typeName: "Color",
          typeNameSlug: "color",
          valueName: word,
          valueNameSlug: slugify(word),
        });
        parsedSomething = true;
      } else if (KNOWN_SHADES.has(word)) {
        attributes.push({
          typeName: "Shade",
          typeNameSlug: "shade",
          valueName: word,
          valueNameSlug: slugify(word),
        });
        parsedSomething = true;
      } else if (/^\d+g$/i.test(word) || /^\d+\s*(ml|ml)$/i.test(word)) {
        attributes.push({
          typeName: "Unit",
          typeNameSlug: "unit",
          valueName: word,
          valueNameSlug: slugify(word),
        });
        parsedSomething = true;
      } else if (/^\d+\s*(pcs|pc|pc\/bag|piece|pieces)$/i.test(word)) {
        attributes.push({
          typeName: "Unit",
          typeNameSlug: "unit",
          valueName: word,
          valueNameSlug: slugify(word),
        });
        parsedSomething = true;
      } else if (/^\d+\s*(capsule|syringe|bottle|tube|kit)$/i.test(word)) {
        attributes.push({
          typeName: "Unit",
          typeNameSlug: "unit",
          valueName: word,
          valueNameSlug: slugify(word),
        });
        parsedSomething = true;
      } else {
        allKnown = false;
      }
    }

    if (parsedSomething) {
      return {
        attributes,
        confidence: allKnown ? "medium" : "low",
        reasoning: `Multi-word: "${trimmed}" partially parsed into ${attributes.length} attribute(s)`,
      };
    }
  }

  // Single word that might be a unit/package descriptor
  if (/^\d+(g|ml|pcs|pc)$/i.test(trimmed)) {
    return {
      attributes: [
        {
          typeName: "Unit",
          typeNameSlug: "unit",
          valueName: trimmed,
          valueNameSlug: slugify(trimmed),
        },
      ],
      confidence: "medium",
      reasoning: `"${trimmed}" looks like a unit/package descriptor`,
    };
  }

  // "kit" / "Kit" etc.
  if (/^(kit|combi|set|pack)$/i.test(trimmed)) {
    return {
      attributes: [
        {
          typeName: "Unit",
          typeNameSlug: "unit",
          valueName: trimmed,
          valueNameSlug: slugify(trimmed),
        },
      ],
      confidence: "medium",
      reasoning: `"${trimmed}" is a kit/package descriptor`,
    };
  }

  // "100 pcs", "100 pcs/bag" etc.
  if (/^\d+\s*(pcs|pc|piece|pieces|bag|box|set|kit)/i.test(trimmed)) {
    return {
      attributes: [
        {
          typeName: "Unit",
          typeNameSlug: "unit",
          valueName: trimmed,
          valueNameSlug: slugify(trimmed),
        },
      ],
      confidence: "medium",
      reasoning: `"${trimmed}" is a quantity/package descriptor`,
    };
  }

  // Check if it matches shade pattern like "Tr 11", "Br 31" (bur codes)
  if (/^[A-Z]{2}\s+\d+$/i.test(trimmed)) {
    return {
      attributes: [
        {
          typeName: "Shade",
          typeNameSlug: "shade",
          valueName: trimmed,
          valueNameSlug: slugify(trimmed),
        },
      ],
      confidence: "low",
      reasoning: `"${trimmed}" looks like a bur/instrument code — treating as Shade but flagged for review`,
    };
  }

  // "Dual cured" — could be a unit/type descriptor
  if (/^(dual|self|light)\s*(cured|cure|curing)$/i.test(trimmed)) {
    return {
      attributes: [
        {
          typeName: "Unit",
          typeNameSlug: "unit",
          valueName: trimmed,
          valueNameSlug: slugify(trimmed),
        },
      ],
      confidence: "low",
      reasoning: `"${trimmed}" describes cure type — treating as Unit but flagged for review`,
    };
  }

  // Anything else — flag as unresolvable
  return {
    attributes: [],
    confidence: "low",
    reasoning: `Cannot confidently parse "${trimmed}" into attribute type/value pairs`,
  };
}

function main() {
  const dataPath = path.resolve(__dirname, "..", "restorative-dash-2.json");
  const outputPath = path.resolve(__dirname, "..", "variant-attribute-mapping.json");

  const raw = fs.readFileSync(dataPath, "utf-8");
  const products: SeedProduct[] = JSON.parse(raw);

  console.log(`Read ${products.length} products from ${dataPath}`);

  const singleVariantMappings: SingleVariantMapping[] = [];
  const multiVariantMappings: MultiVariantProductMapping[] = [];
  const unresolvedVariants: {
    productSlug: string;
    productName: string;
    variantName: string;
    reasoning: string;
  }[] = [];

  let totalVariants = 0;
  let lowConfidenceCount = 0;

  for (const product of products) {
    const variants = product.variants;

    if (variants.length === 1) {
      const v = variants[0];
      totalVariants++;
      const parsed = parseVariantName(v.name);

      const mapping: SingleVariantMapping = {
        existingProductSlug: product.slug,
        existingProductName: product.name,
        variantName: v.name,
        action: "collapse",
        newPrice: v.price,
        newStock: v.stock,
        newSku: null,
        attributeValues: parsed.attributes,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning,
      };

      singleVariantMappings.push(mapping);

      if (parsed.confidence === "low") {
        lowConfidenceCount++;
        unresolvedVariants.push({
          productSlug: product.slug,
          productName: product.name,
          variantName: v.name,
          reasoning: parsed.reasoning,
        });
      }
    } else {
      const variantMappings = variants.map((v) => {
        totalVariants++;
        const parsed = parseVariantName(v.name);

        const newProductName =
          parsed.attributes.length > 0
            ? `${product.name} ${parsed.attributes.map((a) => a.valueName).join(" ")}`
            : `${product.name} ${v.name}`;

        const newProductSlug =
          parsed.attributes.length > 0
            ? `${product.slug}-${parsed.attributes.map((a) => a.valueNameSlug).join("-")}`
            : `${product.slug}-${slugify(v.name)}`;

        if (parsed.confidence === "low") {
          lowConfidenceCount++;
          unresolvedVariants.push({
            productSlug: product.slug,
            productName: product.name,
            variantName: v.name,
            reasoning: parsed.reasoning,
          });
        }

        return {
          variantName: v.name,
          newProductName,
          newProductSlug,
          price: v.price,
          stock: v.stock,
          sku: null,
          attributeValues: parsed.attributes,
          confidence: parsed.confidence,
          reasoning: parsed.reasoning,
        };
      });

      multiVariantMappings.push({
        existingProductSlug: product.slug,
        existingProductName: product.name,
        variants: variantMappings,
        inheritedFields: {
          brand: product.brand,
          category: product.category,
          madeIn: product.madeIn,
          description: product.description,
          imageCount: product.images.length,
          specGroupCount: product.specGroups.length,
        },
      });
    }
  }

  // Summary stats
  const summary = {
    totalProducts: products.length,
    totalVariants,
    singleVariantProducts: singleVariantMappings.length,
    multiVariantProducts: multiVariantMappings.length,
    lowConfidenceVariants: lowConfidenceCount,
    highConfidenceVariants: totalVariants - lowConfidenceCount,
    generatedAt: new Date().toISOString(),
  };

  // Collect all unique attribute types found
  const attributeTypesFound = new Set<string>();
  for (const m of singleVariantMappings) {
    for (const a of m.attributeValues) attributeTypesFound.add(a.typeName);
  }
  for (const m of multiVariantMappings) {
    for (const v of m.variants) {
      for (const a of v.attributeValues) attributeTypesFound.add(a.typeName);
    }
  }

  const output = {
    _summary: summary,
    _attributeTypesFound: [...attributeTypesFound].sort(),
    _instructions:
      "Review this file. Low-confidence items are in unresolvedVariants. Approve or correct before Phase C.",
    singleVariantProducts: singleVariantMappings,
    multiVariantProducts: multiVariantMappings,
    unresolvedVariants,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(`\nMapping written to ${outputPath}`);
  console.log(`\nSummary:`);
  console.log(`  Total products: ${summary.totalProducts}`);
  console.log(`  Total variants: ${summary.totalVariants}`);
  console.log(`  Single-variant products (collapse): ${summary.singleVariantProducts}`);
  console.log(`  Multi-variant products (split): ${summary.multiVariantProducts}`);
  console.log(`  High confidence: ${summary.highConfidenceVariants}`);
  console.log(`  Low confidence (need review): ${summary.lowConfidenceVariants}`);
  console.log(`  Attribute types found: ${[...attributeTypesFound].join(", ")}`);
}

main();
