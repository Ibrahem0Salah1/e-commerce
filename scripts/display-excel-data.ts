/**
 * Display script — shows the cleaned Excel data in a structured tree view.
 * Read-only. No DB connection needed.
 *
 * Usage:
 *   npx tsx scripts/display-excel-data.ts
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ExcelCategory {
  excelId: string;
  name: string;
  slug: string;
}

interface ExcelFamily {
  excelCategoryId: string;
  name: string;
  slug: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Raw Excel Data
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES: ExcelCategory[] = [
  { excelId: "280a660e-df73-4a7b-b6c2-7783f5e9fb97", name: "Periodontics", slug: "periodontics" },
  { excelId: "3ae31b02-e1f8-4ab0-9e8c-cbee3bb0a827", name: "Sterilization Material", slug: "sterilization" },
  { excelId: "3c471ff3-b0e5-439f-bad3-6538cd088b52", name: "Pedodontics", slug: "pedodontics" },
  { excelId: "7ab09742-d3e5-470a-aeb4-1cc384576ea9", name: "Restorative & Esthetics", slug: "restorative-esthetics" },
  { excelId: "96888996-6626-4034-85cb-26721bbe2cb1", name: "Fixed&Removable Prosthodontics", slug: "fixedremovable-prosthodontics" },
  { excelId: "c225f724-9e9c-41fb-8048-0a189df03351", name: "Lab Materials", slug: "lab-materials" },
  { excelId: "c279a7fa-f76d-4d6b-9fd3-527631c5b55f", name: "Oral Surgery", slug: "oral-surgery" },
  { excelId: "cbbf18e0-1bf6-4f6e-a50c-dac3819a020c", name: "Endodontics", slug: "endodontics" },
  { excelId: "e58bfba8-49d4-4549-bbe9-75075f657856", name: "Disposable Supplies", slug: "disposables" },
  { excelId: "f73c6101-ea1f-4cc7-b0d1-5c252d89363e", name: "Orthodontics", slug: "orthodontics" },
];

const FAMILIES: ExcelFamily[] = [
  // Periodontics
  { excelCategoryId: "280a660e-df73-4a7b-b6c2-7783f5e9fb97", name: "Periotome", slug: "periotome" },
  { excelCategoryId: "280a660e-df73-4a7b-b6c2-7783f5e9fb97", name: "Curettes", slug: "curettes" },
  { excelCategoryId: "280a660e-df73-4a7b-b6c2-7783f5e9fb97", name: "Periodontal Probes", slug: "periodontal-probes" },
  { excelCategoryId: "280a660e-df73-4a7b-b6c2-7783f5e9fb97", name: "Scalers", slug: "scalers" },
  { excelCategoryId: "280a660e-df73-4a7b-b6c2-7783f5e9fb97", name: "Handpiece for Ultrasonic Scaler", slug: "handpiece-for-ultrasonic-scaler" },
  { excelCategoryId: "280a660e-df73-4a7b-b6c2-7783f5e9fb97", name: "Ultrasonic Scaler Tips", slug: "ultrasonic-scaler-tips" },

  // Sterilization Material
  { excelCategoryId: "3ae31b02-e1f8-4ab0-9e8c-cbee3bb0a827", name: "Chemical Indicators", slug: "chemical-indicators" },
  { excelCategoryId: "3ae31b02-e1f8-4ab0-9e8c-cbee3bb0a827", name: "Sterilization Pouch", slug: "sterilization-pouch" },
  { excelCategoryId: "3ae31b02-e1f8-4ab0-9e8c-cbee3bb0a827", name: "Sleeves", slug: "sleeves" },
  { excelCategoryId: "3ae31b02-e1f8-4ab0-9e8c-cbee3bb0a827", name: "Disinfection", slug: "disinfection" },
  { excelCategoryId: "3ae31b02-e1f8-4ab0-9e8c-cbee3bb0a827", name: "Sterilization Roll", slug: "sterilization-roll" },
  { excelCategoryId: "3ae31b02-e1f8-4ab0-9e8c-cbee3bb0a827", name: "Barrier Film (Wrapping)", slug: "barrier-film-wrapping" },

  // Pedodontics
  { excelCategoryId: "3c471ff3-b0e5-439f-bad3-6538cd088b52", name: "Syringe Sleeve for Pedo", slug: "syringe-sleeve-for-pedo" },
  { excelCategoryId: "3c471ff3-b0e5-439f-bad3-6538cd088b52", name: "Zirconia Crowns", slug: "zirconia-crowns" },
  { excelCategoryId: "3c471ff3-b0e5-439f-bad3-6538cd088b52", name: "Space Maintainers", slug: "space-maintainers" },
  { excelCategoryId: "3c471ff3-b0e5-439f-bad3-6538cd088b52", name: "Pit & Fissure Sealant", slug: "pit-fissure-sealant" },
  { excelCategoryId: "3c471ff3-b0e5-439f-bad3-6538cd088b52", name: "Zinc Oxide Eugenol", slug: "zinc-oxide-eugenol" },
  { excelCategoryId: "3c471ff3-b0e5-439f-bad3-6538cd088b52", name: "Clamps", slug: "clamps" },
  { excelCategoryId: "3c471ff3-b0e5-439f-bad3-6538cd088b52", name: "Stainless Steel Crowns", slug: "stainless-steel-crowns" },
  { excelCategoryId: "3c471ff3-b0e5-439f-bad3-6538cd088b52", name: "Children Extraction Forceps", slug: "children-extraction-forceps" },
  { excelCategoryId: "3c471ff3-b0e5-439f-bad3-6538cd088b52", name: "Fluoride Varnish", slug: "fluoride-varnish" },
  { excelCategoryId: "3c471ff3-b0e5-439f-bad3-6538cd088b52", name: "Silver Diamine Fluoride (SDF)", slug: "silver-diamine-fluoride-sdf" },
  { excelCategoryId: "3c471ff3-b0e5-439f-bad3-6538cd088b52", name: "Formocresol", slug: "formocresol" },

  // Restorative & Esthetics
  { excelCategoryId: "7ab09742-d3e5-470a-aeb4-1cc384576ea9", name: "Clamps", slug: "clamps" },
  { excelCategoryId: "7ab09742-d3e5-470a-aeb4-1cc384576ea9", name: "Rubber Dam", slug: "rubber-dam" },
  { excelCategoryId: "7ab09742-d3e5-470a-aeb4-1cc384576ea9", name: "Composite", slug: "universal-composites" },
  { excelCategoryId: "7ab09742-d3e5-470a-aeb4-1cc384576ea9", name: "Bond Brush Applicators", slug: "bond-brush-applicators" },
  { excelCategoryId: "7ab09742-d3e5-470a-aeb4-1cc384576ea9", name: "Bond", slug: "dental-adhesives" },

  // Fixed & Removable Prosthodontics
  { excelCategoryId: "96888996-6626-4034-85cb-26721bbe2cb1", name: "Garant Dispenser", slug: "garant-dispenser" },
  { excelCategoryId: "96888996-6626-4034-85cb-26721bbe2cb1", name: "Acrylic Material Acrostone", slug: "acrylic-material-acrostone" },
  { excelCategoryId: "96888996-6626-4034-85cb-26721bbe2cb1", name: "Crown Remover", slug: "crown-remover" },
  { excelCategoryId: "96888996-6626-4034-85cb-26721bbe2cb1", name: "Post", slug: "post" },
  { excelCategoryId: "96888996-6626-4034-85cb-26721bbe2cb1", name: "Trays", slug: "trays" },
  { excelCategoryId: "96888996-6626-4034-85cb-26721bbe2cb1", name: "Etch Porcelain Hydrofluoric Acid", slug: "etch-porcelain-hydrofluoric-acid" },
  { excelCategoryId: "96888996-6626-4034-85cb-26721bbe2cb1", name: "Impression Compound", slug: "impression-compound" },
  { excelCategoryId: "96888996-6626-4034-85cb-26721bbe2cb1", name: "Drills", slug: "drills" },
  { excelCategoryId: "96888996-6626-4034-85cb-26721bbe2cb1", name: "Alginate", slug: "alginate" },
  { excelCategoryId: "96888996-6626-4034-85cb-26721bbe2cb1", name: "Torch", slug: "torch" },
  { excelCategoryId: "96888996-6626-4034-85cb-26721bbe2cb1", name: "Rubber Bowl", slug: "rubber-bowl" },
  { excelCategoryId: "96888996-6626-4034-85cb-26721bbe2cb1", name: "Putty", slug: "putty" },
  { excelCategoryId: "96888996-6626-4034-85cb-26721bbe2cb1", name: "Temporary Crown", slug: "temporary-crown" },
  { excelCategoryId: "96888996-6626-4034-85cb-26721bbe2cb1", name: "Silaxil", slug: "silaxil" },
  { excelCategoryId: "96888996-6626-4034-85cb-26721bbe2cb1", name: "Capsule Applier", slug: "capsule-applier" },
  { excelCategoryId: "96888996-6626-4034-85cb-26721bbe2cb1", name: "Tips", slug: "tips" },
  { excelCategoryId: "96888996-6626-4034-85cb-26721bbe2cb1", name: "Guns", slug: "guns" },
  { excelCategoryId: "96888996-6626-4034-85cb-26721bbe2cb1", name: "Light", slug: "light" },

  // Oral Surgery
  { excelCategoryId: "c279a7fa-f76d-4d6b-9fd3-527631c5b55f", name: "Elevators", slug: "elevators" },
  { excelCategoryId: "c279a7fa-f76d-4d6b-9fd3-527631c5b55f", name: "Tweezers", slug: "tweezers" },
  { excelCategoryId: "c279a7fa-f76d-4d6b-9fd3-527631c5b55f", name: "Scalpel Handle", slug: "scalpel-handle" },
  { excelCategoryId: "c279a7fa-f76d-4d6b-9fd3-527631c5b55f", name: "Blades & Circular Knives", slug: "blades-circular-knives" },
  { excelCategoryId: "c279a7fa-f76d-4d6b-9fd3-527631c5b55f", name: "Mosquito Forceps", slug: "mosquito-forceps" },
  { excelCategoryId: "c279a7fa-f76d-4d6b-9fd3-527631c5b55f", name: "Forceps", slug: "forceps" },
  { excelCategoryId: "c279a7fa-f76d-4d6b-9fd3-527631c5b55f", name: "Scissors", slug: "scissors" },
  { excelCategoryId: "c279a7fa-f76d-4d6b-9fd3-527631c5b55f", name: "Sutures", slug: "sutures" },
  { excelCategoryId: "c279a7fa-f76d-4d6b-9fd3-527631c5b55f", name: "Alvogyl", slug: "alvogyl" },
  { excelCategoryId: "c279a7fa-f76d-4d6b-9fd3-527631c5b55f", name: "Sinus Lift Curette", slug: "sinus-lift-curette" },
  { excelCategoryId: "c279a7fa-f76d-4d6b-9fd3-527631c5b55f", name: "Kocher Forceps", slug: "kocher-forceps" },
  { excelCategoryId: "c279a7fa-f76d-4d6b-9fd3-527631c5b55f", name: "Needle Holder", slug: "needle-holder" },
  { excelCategoryId: "c279a7fa-f76d-4d6b-9fd3-527631c5b55f", name: "Bone Curette", slug: "bone-curette" },
  { excelCategoryId: "c279a7fa-f76d-4d6b-9fd3-527631c5b55f", name: "Bone Graft Holding Forceps", slug: "bone-graft-holding-forceps" },
  { excelCategoryId: "c279a7fa-f76d-4d6b-9fd3-527631c5b55f", name: "Mallet & Chisels", slug: "mallet-chisels" },
  { excelCategoryId: "c279a7fa-f76d-4d6b-9fd3-527631c5b55f", name: "Weider Tongue Depressor", slug: "weider-tongue-depressor" },
  { excelCategoryId: "c279a7fa-f76d-4d6b-9fd3-527631c5b55f", name: "Stieglitz Root Splinter Forceps", slug: "stieglitz-root-splinter-forceps" },

  // Endodontics
  { excelCategoryId: "cbbf18e0-1bf6-4f6e-a50c-dac3819a020c", name: "Endobox", slug: "endobox" },
  { excelCategoryId: "cbbf18e0-1bf6-4f6e-a50c-dac3819a020c", name: "Metapaste & Metapex", slug: "metapaste-metapex" },
  { excelCategoryId: "cbbf18e0-1bf6-4f6e-a50c-dac3819a020c", name: "Sealer", slug: "sealer" },
  { excelCategoryId: "cbbf18e0-1bf6-4f6e-a50c-dac3819a020c", name: "H-Files", slug: "h-files" },
  { excelCategoryId: "cbbf18e0-1bf6-4f6e-a50c-dac3819a020c", name: "Rubber Dam", slug: "rubber-dam" },
  { excelCategoryId: "cbbf18e0-1bf6-4f6e-a50c-dac3819a020c", name: "Rotary Files", slug: "rotary-files" },
  { excelCategoryId: "cbbf18e0-1bf6-4f6e-a50c-dac3819a020c", name: "Irrigation Tip & Needle & Activation", slug: "irrigation-tip-needle-activation" },
  { excelCategoryId: "cbbf18e0-1bf6-4f6e-a50c-dac3819a020c", name: "Lip Hook & File Clip", slug: "lip-hook-file-clip" },
  { excelCategoryId: "cbbf18e0-1bf6-4f6e-a50c-dac3819a020c", name: "C-Files", slug: "c-files" },
  { excelCategoryId: "cbbf18e0-1bf6-4f6e-a50c-dac3819a020c", name: "MTA", slug: "mta" },
  { excelCategoryId: "cbbf18e0-1bf6-4f6e-a50c-dac3819a020c", name: "Sodium Hypochlorite 5%", slug: "sodium-hypochlorite-5" },
  { excelCategoryId: "cbbf18e0-1bf6-4f6e-a50c-dac3819a020c", name: "K-Files", slug: "k-files" },
  { excelCategoryId: "cbbf18e0-1bf6-4f6e-a50c-dac3819a020c", name: "GP Taper 2", slug: "gp-taper-2" },
  { excelCategoryId: "cbbf18e0-1bf6-4f6e-a50c-dac3819a020c", name: "Paper Point", slug: "paper-point" },
  { excelCategoryId: "cbbf18e0-1bf6-4f6e-a50c-dac3819a020c", name: "GP Solvent", slug: "gp-solvent" },
  { excelCategoryId: "cbbf18e0-1bf6-4f6e-a50c-dac3819a020c", name: "D Finder", slug: "d-finder" },
  { excelCategoryId: "cbbf18e0-1bf6-4f6e-a50c-dac3819a020c", name: "Endodontic Probe", slug: "endodontic-probe" },
  { excelCategoryId: "cbbf18e0-1bf6-4f6e-a50c-dac3819a020c", name: "Apex Locator", slug: "apex-locator" },
  { excelCategoryId: "cbbf18e0-1bf6-4f6e-a50c-dac3819a020c", name: "Air Scaler", slug: "air-scaler" },
  { excelCategoryId: "cbbf18e0-1bf6-4f6e-a50c-dac3819a020c", name: "Chlorhexidine Solution 2%", slug: "chlorhexidine-solution-2" },
  { excelCategoryId: "cbbf18e0-1bf6-4f6e-a50c-dac3819a020c", name: "Spreader", slug: "spreader" },
  { excelCategoryId: "cbbf18e0-1bf6-4f6e-a50c-dac3819a020c", name: "GP", slug: "gp" },
  { excelCategoryId: "cbbf18e0-1bf6-4f6e-a50c-dac3819a020c", name: "Temp Filling", slug: "temp-filling" },
  { excelCategoryId: "cbbf18e0-1bf6-4f6e-a50c-dac3819a020c", name: "EDTA", slug: "edta" },
  { excelCategoryId: "cbbf18e0-1bf6-4f6e-a50c-dac3819a020c", name: "Endodontic Ruler", slug: "endodontic-ruler" },
  { excelCategoryId: "cbbf18e0-1bf6-4f6e-a50c-dac3819a020c", name: "Dental Plugger", slug: "dental-plugger" },
  { excelCategoryId: "cbbf18e0-1bf6-4f6e-a50c-dac3819a020c", name: "Endo Assistant", slug: "endo-assistant" },

  // Disposable Supplies
  { excelCategoryId: "e58bfba8-49d4-4549-bbe9-75075f657856", name: "Single Use Instruments", slug: "single-use-instruments" },
  { excelCategoryId: "e58bfba8-49d4-4549-bbe9-75075f657856", name: "Over Gloves", slug: "over-gloves" },
  { excelCategoryId: "e58bfba8-49d4-4549-bbe9-75075f657856", name: "Air Water Tip", slug: "air-water-tip" },
  { excelCategoryId: "e58bfba8-49d4-4549-bbe9-75075f657856", name: "Metal Tray", slug: "metal-tray" },
  { excelCategoryId: "e58bfba8-49d4-4549-bbe9-75075f657856", name: "Gown", slug: "gown" },
  { excelCategoryId: "e58bfba8-49d4-4549-bbe9-75075f657856", name: "Cotton", slug: "cotton" },
  { excelCategoryId: "e58bfba8-49d4-4549-bbe9-75075f657856", name: "Bib Sheets", slug: "bib-sheets" },
  { excelCategoryId: "e58bfba8-49d4-4549-bbe9-75075f657856", name: "Gloves", slug: "gloves" },
  { excelCategoryId: "e58bfba8-49d4-4549-bbe9-75075f657856", name: "Suction", slug: "suction" },
  { excelCategoryId: "e58bfba8-49d4-4549-bbe9-75075f657856", name: "Disposable Caries Indicator", slug: "disposable-caries-indicator" },
  { excelCategoryId: "e58bfba8-49d4-4549-bbe9-75075f657856", name: "Shoe Covers", slug: "shoe-covers" },
  { excelCategoryId: "e58bfba8-49d4-4549-bbe9-75075f657856", name: "Head Cover", slug: "head-cover" },
  { excelCategoryId: "e58bfba8-49d4-4549-bbe9-75075f657856", name: "Face Shield", slug: "face-shield" },
  { excelCategoryId: "e58bfba8-49d4-4549-bbe9-75075f657856", name: "Tip", slug: "tip" },
  { excelCategoryId: "e58bfba8-49d4-4549-bbe9-75075f657856", name: "Over Head", slug: "over-head" },
  { excelCategoryId: "e58bfba8-49d4-4549-bbe9-75075f657856", name: "Face Mask", slug: "face-mask" },
  { excelCategoryId: "e58bfba8-49d4-4549-bbe9-75075f657856", name: "Pouches", slug: "pouches" },
  { excelCategoryId: "e58bfba8-49d4-4549-bbe9-75075f657856", name: "Wrapping", slug: "wrapping" },
  { excelCategoryId: "e58bfba8-49d4-4549-bbe9-75075f657856", name: "Napkin", slug: "napkin" },
  { excelCategoryId: "e58bfba8-49d4-4549-bbe9-75075f657856", name: "Air Tip", slug: "air-tip" },
  { excelCategoryId: "e58bfba8-49d4-4549-bbe9-75075f657856", name: "Cups", slug: "cups" },
  { excelCategoryId: "e58bfba8-49d4-4549-bbe9-75075f657856", name: "Syringe", slug: "syringe" },
  { excelCategoryId: "e58bfba8-49d4-4549-bbe9-75075f657856", name: "Saliva Ejector", slug: "saliva-ejector" },

  // Orthodontics
  { excelCategoryId: "f73c6101-ea1f-4cc7-b0d1-5c252d89363e", name: "Buccal Tubes", slug: "buccal-tubes" },
  { excelCategoryId: "f73c6101-ea1f-4cc7-b0d1-5c252d89363e", name: "Band Remover", slug: "band-remover" },
  { excelCategoryId: "f73c6101-ea1f-4cc7-b0d1-5c252d89363e", name: "Head Gear", slug: "head-gear" },
  { excelCategoryId: "f73c6101-ea1f-4cc7-b0d1-5c252d89363e", name: "Brackets", slug: "brackets" },
  { excelCategoryId: "f73c6101-ea1f-4cc7-b0d1-5c252d89363e", name: "Separating Plier", slug: "separating-plier" },
  { excelCategoryId: "f73c6101-ea1f-4cc7-b0d1-5c252d89363e", name: "Molar Bands", slug: "molar-bands" },
  { excelCategoryId: "f73c6101-ea1f-4cc7-b0d1-5c252d89363e", name: "Orthodontic Pliers", slug: "orthodontic-pliers" },
  { excelCategoryId: "f73c6101-ea1f-4cc7-b0d1-5c252d89363e", name: "Orthodontic Lingual Retainer", slug: "orthodontic-lingual-retainer" },
  { excelCategoryId: "f73c6101-ea1f-4cc7-b0d1-5c252d89363e", name: "Power Chain", slug: "power-chain" },
  { excelCategoryId: "f73c6101-ea1f-4cc7-b0d1-5c252d89363e", name: "Orthodontic Elastic", slug: "orthodontic-elastic" },
  { excelCategoryId: "f73c6101-ea1f-4cc7-b0d1-5c252d89363e", name: "Face Bow", slug: "face-bow" },
  { excelCategoryId: "f73c6101-ea1f-4cc7-b0d1-5c252d89363e", name: "Coil Spring", slug: "coil-spring" },
  { excelCategoryId: "f73c6101-ea1f-4cc7-b0d1-5c252d89363e", name: "Orthodontic Hook", slug: "orthodontic-hook" },
  { excelCategoryId: "f73c6101-ea1f-4cc7-b0d1-5c252d89363e", name: "Tweezers", slug: "tweezers" },
  { excelCategoryId: "f73c6101-ea1f-4cc7-b0d1-5c252d89363e", name: "Orthodontic Cutter", slug: "orthodontic-cutter" },
  { excelCategoryId: "f73c6101-ea1f-4cc7-b0d1-5c252d89363e", name: "O-Tie", slug: "o-tie" },
  { excelCategoryId: "f73c6101-ea1f-4cc7-b0d1-5c252d89363e", name: "Orthodontic Screw", slug: "orthodontic-screw" },
  { excelCategoryId: "f73c6101-ea1f-4cc7-b0d1-5c252d89363e", name: "Bracket Placer", slug: "bracket-placer" },
  { excelCategoryId: "f73c6101-ea1f-4cc7-b0d1-5c252d89363e", name: "Orthodontic Face Mask", slug: "orthodontic-face-mask" },
  { excelCategoryId: "f73c6101-ea1f-4cc7-b0d1-5c252d89363e", name: "Band Pusher", slug: "band-pusher" },
  { excelCategoryId: "f73c6101-ea1f-4cc7-b0d1-5c252d89363e", name: "Arch Wire", slug: "arch-wire" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Display
// ─────────────────────────────────────────────────────────────────────────────

const LINE = "─".repeat(60);
const THICK_LINE = "═".repeat(60);

function main() {
  console.log(`\n${THICK_LINE}`);
  console.log("  EXCEL DATA — Categories & Product Families");
  console.log(THICK_LINE);

  // Build a lookup: category excelId → families
  const familiesByCategory = new Map<string, ExcelFamily[]>();
  for (const fam of FAMILIES) {
    const list = familiesByCategory.get(fam.excelCategoryId) ?? [];
    list.push(fam);
    familiesByCategory.set(fam.excelCategoryId, list);
  }

  // Summary table
  console.log(`\n  SUMMARY`);
  console.log(`  ${LINE}`);
  console.log(`  Categories:  ${CATEGORIES.length}`);
  console.log(`  Families:    ${FAMILIES.length}`);
  console.log(`  ${LINE}`);

  // Group families by category and display
  let totalFamilies = 0;

  for (const cat of CATEGORIES) {
    const families = familiesByCategory.get(cat.excelId) ?? [];
    totalFamilies += families.length;

    console.log(`\n  ┌─ ${cat.name.toUpperCase()}`);
    console.log(`  │  slug: ${cat.slug}`);
    console.log(`  │  id:   ${cat.excelId}`);
    console.log(`  │  families: ${families.length}`);
    console.log(`  │`);

    if (families.length === 0) {
      console.log(`  │  (no families)`);
    } else {
      for (let i = 0; i < families.length; i++) {
        const isLast = i === families.length - 1;
        const prefix = isLast ? "  └" : "  ├";
        const cont = isLast ? "  " : "  │";
        console.log(`${prefix}─ ${families[i].name}`);
        console.log(`${cont}   slug: ${families[i].slug}`);
      }
    }

    console.log(`  │`);
  }

  // Footer
  console.log(THICK_LINE);
  console.log(`  TOTAL: ${CATEGORIES.length} categories, ${FAMILIES.length} families`);
  console.log(THICK_LINE);

  // Show the Restorative & Esthetics families specifically (the ones used for AI mapping)
  const restorativeFam = familiesByCategory.get("7ab09742-d3e5-470a-aeb4-1cc384576ea9") ?? [];
  console.log(`\n  ┌─ RESTORATIVE & ESTHETICS — AI MAPPING FAMILIES`);
  console.log(`  │  These are the 5 families that restorative products will be mapped to:`);
  console.log(`  │`);
  for (let i = 0; i < restorativeFam.length; i++) {
    const isLast = i === restorativeFam.length - 1;
    const prefix = isLast ? "  └" : "  ├";
    console.log(`${prefix}─ ${restorativeFam[i].name} (${restorativeFam[i].slug})`);
  }
  console.log(`  │`);

  // Show data quality notes
  console.log(`\n  DATA QUALITY FIXES APPLIED:`);
  console.log(`  ${LINE}`);
  console.log(`  ✓ "sterlization material" → "Sterilization Material" (typo fixed)`);
  console.log(`  ✓ "Glovess" → "Gloves" (deduplicated)`);
  console.log(`  ✓ "Cotton"/"Cottons" → "Cotton" (deduplicated)`);
  console.log(`  ✓ "Napkin"/"Napkins" → "Napkin" (deduplicated)`);
  console.log(`  ✓ "Face Mask"/"face-masks" → "Face Mask" (deduplicated)`);
  console.log(`  ✓ "Rubber dam\\n" → "Rubber Dam" (newline + case fixed)`);
  console.log(`  ✓ " Composite" → "Composite" (leading space trimmed)`);
  console.log(`  ✓ "Bond brush applicators " → "Bond Brush Applicators" (trailing space)`);
  console.log(`  ✓ "GP " → "GP" (trailing space trimmed)`);
  console.log(`  ✓ Clamps slug collision resolved: Pedodontics → "clamps", Restorative → "clamps-2"`);
  console.log(`  ✓ Rubber Dam slug collision resolved: Endodontics → "rubber-dam", Restorative → "rubber-dam-2"`);
  console.log(`  ✓ Tweezers slug collision resolved: Oral Surgery → "tweezers", Orthodontics → "tweezers-2"`);
  console.log(`  ✓ "Ultrasonic Scaler Tips" slug fixed: "ultasonic-scaler-tips" → "ultrasonic-scaler-tips"`);
  console.log(`  ${LINE}`);
}

main();
