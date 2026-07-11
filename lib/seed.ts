import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

// Branded placeholder images — swap these for real product photos later.
// Format: https://placehold.co/{size}/{bg}/{fg}?text={label}
const productImg = (label: string, bg = "eaf1fc", fg = "0048b5") =>
  `https://placehold.co/800x800/${bg}/${fg}?text=${encodeURIComponent(label)}`;

const brandLogo = (label: string) =>
  `https://placehold.co/240x120/ffffff/0048b5?text=${encodeURIComponent(label)}`;

const categoryImg = (label: string) =>
  `https://placehold.co/600x400/dce8fb/0048b5?text=${encodeURIComponent(label)}`;

const userAvatar = (initials: string) =>
  `https://placehold.co/100x100/0048b5/ffffff?text=${encodeURIComponent(initials)}`;

// ─────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding database...");

  // Clean slate — order matters due to foreign key constraints
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.specification.deleteMany();
  await prisma.specificationGroup.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  // Only remove seed-generated users — never touch real accounts
  await prisma.user.deleteMany({
    where: { email: { endsWith: "@seed.dentastore.test" } },
  });

  console.log("  ✔ cleared existing data");

  // ───────────────────────────────────────
  // CATEGORIES
  // ───────────────────────────────────────

  const [
    catOrtho,
    catEndo,
    catRestorative,
    catEquipment,
    catDisposables,
    catHygiene,
    catAnesthesia,
    catRadiology,
  ] = await Promise.all([
    prisma.category.create({
      data: {
        name: "Orthodontics",
        slug: "orthodontics",
        description:
          "Brackets, archwires, and orthodontic accessories for braces and aligner cases.",
        image: categoryImg("Orthodontics"),
      },
    }),
    prisma.category.create({
      data: {
        name: "Endodontics",
        slug: "endodontics",
        description:
          "Root canal files, obturation materials, and irrigation supplies.",
        image: categoryImg("Endodontics"),
      },
    }),
    prisma.category.create({
      data: {
        name: "Restorative & Composites",
        slug: "restorative-composites",
        description:
          "Composite resins, bonding agents, and cements for direct restorations.",
        image: categoryImg("Restorative"),
      },
    }),
    prisma.category.create({
      data: {
        name: "Equipment",
        slug: "equipment",
        description: "Curing lights, handpieces, and chairside equipment.",
        image: categoryImg("Equipment"),
      },
    }),
    prisma.category.create({
      data: {
        name: "Disposables & PPE",
        slug: "disposables-ppe",
        description: "Gloves, masks, bibs, and single-use clinical essentials.",
        image: categoryImg("Disposables"),
      },
    }),
    prisma.category.create({
      data: {
        name: "Hygiene & Prevention",
        slug: "hygiene-prevention",
        description:
          "Fluoride treatments, prophylaxis paste, and preventive care products.",
        image: categoryImg("Hygiene"),
      },
    }),
    prisma.category.create({
      data: {
        name: "Anesthesia",
        slug: "anesthesia",
        description:
          "Local anesthetic cartridges, syringes, and topical agents.",
        image: categoryImg("Anesthesia"),
      },
    }),
    prisma.category.create({
      data: {
        name: "Radiology",
        slug: "radiology",
        description:
          "Digital sensors, imaging plates, and radiography accessories.",
        image: categoryImg("Radiology"),
      },
    }),
  ]);

  console.log("  ✔ categories created");

  // ───────────────────────────────────────
  // BRANDS
  // ───────────────────────────────────────

  const [
    brand3M,
    brandDentsply,
    brandIvoclar,
    brandGC,
    brandKerr,
    brandSeptodont,
    brandVoco,
    brandColtene,
  ] = await Promise.all([
    prisma.brand.create({
      data: {
        name: "3M Oral Care",
        slug: "3m-oral-care",
        logo: brandLogo("3M"),
        description:
          "Global leader in adhesives, composites, and orthodontic systems.",
      },
    }),
    prisma.brand.create({
      data: {
        name: "Dentsply Sirona",
        slug: "dentsply-sirona",
        logo: brandLogo("Dentsply Sirona"),
        description:
          "Comprehensive solutions for endodontics, imaging, and restorative dentistry.",
      },
    }),
    prisma.brand.create({
      data: {
        name: "Ivoclar Vivadent",
        slug: "ivoclar-vivadent",
        logo: brandLogo("Ivoclar"),
        description:
          "Premium materials and equipment for restorative and digital dentistry.",
      },
    }),
    prisma.brand.create({
      data: {
        name: "GC Corporation",
        slug: "gc-corporation",
        logo: brandLogo("GC"),
        description:
          "Japanese manufacturer known for preventive and restorative dental materials.",
      },
    }),
    prisma.brand.create({
      data: {
        name: "Kerr Dental",
        slug: "kerr-dental",
        logo: brandLogo("Kerr"),
        description:
          "Restorative materials, endodontic systems, and rotary instruments.",
      },
    }),
    prisma.brand.create({
      data: {
        name: "Septodont",
        slug: "septodont",
        logo: brandLogo("Septodont"),
        description:
          "Specialist in anesthetics, endodontics, and pharmaceutical dental products.",
      },
    }),
    prisma.brand.create({
      data: {
        name: "VOCO",
        slug: "voco",
        logo: brandLogo("VOCO"),
        description:
          "German-engineered restorative and preventive dental materials.",
      },
    }),
    prisma.brand.create({
      data: {
        name: "Coltene",
        slug: "coltene",
        logo: brandLogo("Coltene"),
        description: "Endodontic, restorative, and infection control products.",
      },
    }),
  ]);

  console.log("  ✔ brands created");

  // ───────────────────────────────────────
  // PRODUCTS
  // ───────────────────────────────────────

  // 1 — Self-Ligating Brackets (Orthodontics / 3M)
  await prisma.product.create({
    data: {
      name: "Self-Ligating Metal Brackets — Roth Prescription",
      slug: "self-ligating-metal-brackets-roth",
      description: ["Precision-milled stainless steel self-ligating brackets with Roth prescription. Reduced friction design for faster archwire engagement and improved patient comfort."],
      basePrice: 850,
      images: [productImg("Self-Ligating Brackets")],
      categoryId: catOrtho.id,
      brandId: brand3M.id,
      featured: true,
      variants: {
        create: [
          {
            name: "Roth .018 — Full Kit (20 brackets)",
            sku: "3M-BRK-018-FK",
            price: 850,
            stock: 24,
          },
          {
            name: "Roth .022 — Full Kit (20 brackets)",
            sku: "3M-BRK-022-FK",
            price: 890,
            stock: 18,
          },
        ],
      },
      specGroups: {
        create: [
          {
            name: "Physical Properties",
            position: 1,
            specs: {
              create: [
                {
                  key: "Material",
                  value: "Stainless Steel (17-4PH)",
                  position: 1,
                },
                {
                  key: "Base Design",
                  value: "Mesh, micro-etched",
                  position: 2,
                },
                {
                  key: "Slot Type",
                  value: "Passive self-ligating",
                  position: 3,
                },
              ],
            },
          },
          {
            name: "Clinical",
            position: 2,
            specs: {
              create: [
                { key: "Prescription", value: "Roth", position: 1 },
                { key: "Hooks", value: "3, 4, 5 with hooks", position: 2 },
                { key: "Sterilization", value: "Autoclavable", position: 3 },
              ],
            },
          },
        ],
      },
    },
  });

  // 2 — NiTi Archwires (Orthodontics / Dentsply)
  await prisma.product.create({
    data: {
      name: "Superelastic NiTi Archwires",
      slug: "superelastic-niti-archwires",
      description: ["Nickel-titanium archwires with consistent superelastic force delivery across a wide temperature range. Ideal for initial leveling and alignment stages."],
      basePrice: 180,
      images: [productImg("NiTi Archwires")],
      categoryId: catOrtho.id,
      brandId: brandDentsply.id,
      featured: false,
      variants: {
        create: [
          {
            name: "0.014 Round — Upper",
            sku: "DS-NITI-014-U",
            price: 180,
            stock: 60,
          },
          {
            name: "0.016 Round — Upper",
            sku: "DS-NITI-016-U",
            price: 185,
            stock: 55,
          },
          {
            name: "0.016x0.022 Rectangular — Upper",
            sku: "DS-NITI-01622-U",
            price: 220,
            stock: 30,
          },
        ],
      },
      specGroups: {
        create: [
          {
            name: "Material",
            position: 1,
            specs: {
              create: [
                { key: "Alloy", value: "Nickel-Titanium (NiTi)", position: 1 },
                { key: "Finish", value: "Polished", position: 2 },
              ],
            },
          },
          {
            name: "Packaging",
            position: 2,
            specs: {
              create: [
                { key: "Quantity", value: "10 wires per pack", position: 1 },
                { key: "Form", value: "Pre-formed arch", position: 2 },
              ],
            },
          },
        ],
      },
    },
  });

  // 3 — Rotary Endo Files (Endodontics / Dentsply)
  await prisma.product.create({
    data: {
      name: "Rotary NiTi Endodontic File System",
      slug: "rotary-niti-endodontic-file-system",
      description: ["Heat-treated NiTi rotary files engineered for flexibility and resistance to cyclic fatigue. Optimized cross-section for efficient debris removal during root canal shaping."],
      basePrice: 620,
      images: [productImg("Rotary Endo Files")],
      categoryId: catEndo.id,
      brandId: brandDentsply.id,
      featured: true,
      variants: {
        create: [
          {
            name: "Assorted Pack — Sizes 15-40",
            sku: "DS-ENDO-AST-1540",
            price: 620,
            stock: 22,
          },
          {
            name: "Single Size — 25/.04 (6 files)",
            sku: "DS-ENDO-2504",
            price: 340,
            stock: 40,
          },
        ],
      },
      specGroups: {
        create: [
          {
            name: "Material",
            position: 1,
            specs: {
              create: [
                { key: "Alloy", value: "Heat-treated NiTi", position: 1 },
                {
                  key: "Cross-section",
                  value: "S-shaped, variable taper",
                  position: 2,
                },
              ],
            },
          },
          {
            name: "Usage",
            position: 2,
            specs: {
              create: [
                { key: "Recommended RPM", value: "300–500 rpm", position: 1 },
                { key: "Use", value: "Single-patient use", position: 2 },
              ],
            },
          },
        ],
      },
    },
  });

  // 4 — Gutta Percha Points (Endodontics / Septodont)
  await prisma.product.create({
    data: {
      name: "Gutta Percha Obturation Points",
      slug: "gutta-percha-obturation-points",
      description: ["Standardized gutta percha points for root canal obturation, color-coded by ISO size for accurate fit verification with rotary file systems."],
      basePrice: 95,
      images: [productImg("Gutta Percha Points")],
      categoryId: catEndo.id,
      brandId: brandSeptodont.id,
      featured: false,
      variants: {
        create: [
          {
            name: "ISO 15-40 — Box of 120",
            sku: "SEP-GP-1540",
            price: 95,
            stock: 80,
          },
          {
            name: "ISO 45-80 — Box of 120",
            sku: "SEP-GP-4580",
            price: 95,
            stock: 65,
          },
        ],
      },
      specGroups: {
        create: [
          {
            name: "Packaging",
            position: 1,
            specs: {
              create: [
                { key: "Quantity", value: "120 points per box", position: 1 },
                { key: "Standard", value: "ISO color-coded", position: 2 },
              ],
            },
          },
        ],
      },
    },
  });

  // 5 — Universal Composite Resin (Restorative / 3M Filtek)
  await prisma.product.create({
    data: {
      name: "Universal Nano-Hybrid Composite Resin",
      slug: "universal-nano-hybrid-composite-resin",
      description: ["Light-cured nano-hybrid composite with high polish retention and shade-blending optical properties, suitable for anterior and posterior restorations."],
      basePrice: 480,
      images: [productImg("Composite Resin")],
      categoryId: catRestorative.id,
      brandId: brand3M.id,
      featured: true,
      variants: {
        create: [
          {
            name: "Shade A1 — 4g Syringe",
            sku: "3M-FILTEK-A1",
            price: 480,
            stock: 45,
          },
          {
            name: "Shade A2 — 4g Syringe",
            sku: "3M-FILTEK-A2",
            price: 480,
            stock: 50,
          },
          {
            name: "Shade A3 — 4g Syringe",
            sku: "3M-FILTEK-A3",
            price: 480,
            stock: 38,
          },
          {
            name: "Shade B1 — 4g Syringe",
            sku: "3M-FILTEK-B1",
            price: 480,
            stock: 20,
          },
        ],
      },
      specGroups: {
        create: [
          {
            name: "Material",
            position: 1,
            specs: {
              create: [
                {
                  key: "Filler Content",
                  value: "78.5% by weight",
                  position: 1,
                },
                {
                  key: "Cure Type",
                  value: "Light-cured (450–470nm)",
                  position: 2,
                },
                { key: "Cure Depth", value: "2mm at 20s", position: 3 },
              ],
            },
          },
          {
            name: "Indications",
            position: 2,
            specs: {
              create: [
                {
                  key: "Use",
                  value: "Anterior & posterior restorations",
                  position: 1,
                },
                { key: "Polish", value: "High gloss retention", position: 2 },
              ],
            },
          },
        ],
      },
    },
  });

  // 6 — Bonding Agent (Restorative / VOCO)
  await prisma.product.create({
    data: {
      name: "Universal Adhesive Bonding Agent",
      slug: "universal-adhesive-bonding-agent",
      description: ["Single-component universal adhesive compatible with total-etch, self-etch, and selective-etch techniques. Reliable bond strength to enamel and dentin."],
      basePrice: 720,
      images: [productImg("Bonding Agent")],
      categoryId: catRestorative.id,
      brandId: brandVoco.id,
      featured: false,
      variants: {
        create: [
          {
            name: "5ml Bottle + Accessories",
            sku: "VOCO-BOND-5ML",
            price: 720,
            stock: 28,
          },
        ],
      },
      specGroups: {
        create: [
          {
            name: "Application",
            position: 1,
            specs: {
              create: [
                {
                  key: "Etch Technique",
                  value: "Total / Self / Selective",
                  position: 1,
                },
                { key: "Solvent", value: "Ethanol-based", position: 2 },
                { key: "Shelf Life", value: "24 months", position: 3 },
              ],
            },
          },
        ],
      },
    },
  });

  // 7 — LED Curing Light (Equipment / Ivoclar)
  await prisma.product.create({
    data: {
      name: "Wireless LED Curing Light",
      slug: "wireless-led-curing-light",
      description: ["Cordless LED curing light with multiple curing modes and a broad spectrum output compatible with all light-cured dental materials. Includes radiometer for output verification."],
      basePrice: 4200,
      images: [productImg("LED Curing Light")],
      categoryId: catEquipment.id,
      brandId: brandIvoclar.id,
      featured: true,
      variants: {
        create: [
          { name: "Standard Kit", sku: "IVO-LED-STD", price: 4200, stock: 12 },
          {
            name: "Kit with Extra Battery + Radiometer",
            sku: "IVO-LED-PRO",
            price: 4950,
            stock: 7,
          },
        ],
      },
      specGroups: {
        create: [
          {
            name: "Performance",
            position: 1,
            specs: {
              create: [
                { key: "Wavelength Range", value: "385–515nm", position: 1 },
                {
                  key: "Light Intensity",
                  value: "Up to 3,200 mW/cm²",
                  position: 2,
                },
                {
                  key: "Curing Modes",
                  value: "High Power, Soft Start, Pulse",
                  position: 3,
                },
              ],
            },
          },
          {
            name: "Power",
            position: 2,
            specs: {
              create: [
                { key: "Battery", value: "Li-ion rechargeable", position: 1 },
                {
                  key: "Operating Time",
                  value: "Up to 80 cycles per charge",
                  position: 2,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 8 — High-Speed Handpiece (Equipment / Kerr)
  await prisma.product.create({
    data: {
      name: "High-Speed Air Turbine Handpiece",
      slug: "high-speed-air-turbine-handpiece",
      description: ["Lightweight high-speed handpiece with push-button bur release, ceramic bearings for reduced noise and vibration, and fiber-optic illumination."],
      basePrice: 3100,
      images: [productImg("Handpiece")],
      categoryId: catEquipment.id,
      brandId: brandKerr.id,
      featured: false,
      variants: {
        create: [
          {
            name: "Standard — Without Light",
            sku: "KERR-HP-STD",
            price: 3100,
            stock: 15,
          },
          {
            name: "Fiber-Optic — With Light",
            sku: "KERR-HP-FO",
            price: 3650,
            stock: 9,
          },
        ],
      },
      specGroups: {
        create: [
          {
            name: "Specifications",
            position: 1,
            specs: {
              create: [
                { key: "Speed", value: "Up to 400,000 rpm", position: 1 },
                { key: "Bearings", value: "Ceramic", position: 2 },
                {
                  key: "Connection",
                  value: "ISO 4-hole / 2-hole adaptable",
                  position: 3,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 9 — Nitrile Examination Gloves (Disposables)
  await prisma.product.create({
    data: {
      name: "Nitrile Examination Gloves — Powder Free",
      slug: "nitrile-examination-gloves-powder-free",
      description: ["Latex-free nitrile examination gloves with textured fingertips for secure grip. Suitable for clinical examination and minor procedures."],
      basePrice: 220,
      images: [productImg("Nitrile Gloves")],
      categoryId: catDisposables.id,
      brandId: null,
      featured: true,
      variants: {
        create: [
          {
            name: "Small — Box of 100",
            sku: "GLV-NIT-S-100",
            price: 220,
            stock: 200,
          },
          {
            name: "Medium — Box of 100",
            sku: "GLV-NIT-M-100",
            price: 220,
            stock: 250,
          },
          {
            name: "Large — Box of 100",
            sku: "GLV-NIT-L-100",
            price: 220,
            stock: 180,
          },
        ],
      },
      specGroups: {
        create: [
          {
            name: "Material",
            position: 1,
            specs: {
              create: [
                {
                  key: "Material",
                  value: "100% Nitrile, latex-free",
                  position: 1,
                },
                { key: "Texture", value: "Textured fingertips", position: 2 },
                { key: "Powder", value: "Powder-free", position: 3 },
              ],
            },
          },
        ],
      },
    },
  });

  // 10 — Disposable Face Masks (Disposables)
  await prisma.product.create({
    data: {
      name: "3-Ply Disposable Face Masks",
      slug: "3-ply-disposable-face-masks",
      description: ["Fluid-resistant 3-ply face masks with adjustable nose wire and soft ear loops. Suitable for everyday clinical use."],
      basePrice: 110,
      images: [productImg("Face Masks")],
      categoryId: catDisposables.id,
      brandId: null,
      featured: false,
      variants: {
        create: [
          {
            name: "Blue — Box of 50",
            sku: "MASK-3PLY-BLUE-50",
            price: 110,
            stock: 300,
          },
          {
            name: "White — Box of 50",
            sku: "MASK-3PLY-WHITE-50",
            price: 110,
            stock: 150,
          },
        ],
      },
      specGroups: {
        create: [
          {
            name: "Packaging",
            position: 1,
            specs: {
              create: [
                {
                  key: "Layers",
                  value: "3-ply with melt-blown filter",
                  position: 1,
                },
                { key: "Quantity", value: "50 masks per box", position: 2 },
              ],
            },
          },
        ],
      },
    },
  });

  // 11 — Fluoride Varnish (Hygiene / 3M)
  await prisma.product.create({
    data: {
      name: "5% Sodium Fluoride Varnish",
      slug: "5-percent-sodium-fluoride-varnish",
      description: ["Fast-setting fluoride varnish for caries prevention, available in multiple flavors. Unit-dose packaging for cross-contamination control."],
      basePrice: 650,
      images: [productImg("Fluoride Varnish")],
      categoryId: catHygiene.id,
      brandId: brand3M.id,
      featured: false,
      variants: {
        create: [
          {
            name: "Mint — 50 Unit Doses",
            sku: "3M-FLVAR-MINT-50",
            price: 650,
            stock: 30,
          },
          {
            name: "Bubblegum — 50 Unit Doses",
            sku: "3M-FLVAR-BG-50",
            price: 650,
            stock: 22,
          },
        ],
      },
      specGroups: {
        create: [
          {
            name: "Composition",
            position: 1,
            specs: {
              create: [
                {
                  key: "Active Ingredient",
                  value: "5% Sodium Fluoride",
                  position: 1,
                },
                {
                  key: "Set Time",
                  value: "Sets on contact with saliva",
                  position: 2,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 12 — Prophylaxis Paste (Hygiene / GC)
  await prisma.product.create({
    data: {
      name: "Prophylaxis Polishing Paste",
      slug: "prophylaxis-polishing-paste",
      description: ["Fluoride-containing prophy paste with fine pumice particles for effective stain removal and tooth polishing during routine cleanings."],
      basePrice: 310,
      images: [productImg("Prophy Paste")],
      categoryId: catHygiene.id,
      brandId: brandGC.id,
      featured: false,
      variants: {
        create: [
          {
            name: "Mint — Cups (200)",
            sku: "GC-PROPHY-MINT-200",
            price: 310,
            stock: 40,
          },
          {
            name: "Strawberry — Cups (200)",
            sku: "GC-PROPHY-STRAW-200",
            price: 310,
            stock: 35,
          },
        ],
      },
      specGroups: {
        create: [
          {
            name: "Composition",
            position: 1,
            specs: {
              create: [
                { key: "Abrasive", value: "Fine pumice", position: 1 },
                { key: "Fluoride", value: "Contains fluoride", position: 2 },
              ],
            },
          },
        ],
      },
    },
  });

  // 13 — Lidocaine Cartridges (Anesthesia / Septodont)
  await prisma.product.create({
    data: {
      name: "Lidocaine 2% with Epinephrine — Anesthetic Cartridges",
      slug: "lidocaine-2-percent-epinephrine-cartridges",
      description: ["Sterile local anesthetic cartridges for dental procedures, providing rapid onset and reliable duration of anesthesia."],
      basePrice: 540,
      images: [productImg("Anesthetic Cartridges")],
      categoryId: catAnesthesia.id,
      brandId: brandSeptodont.id,
      featured: false,
      variants: {
        create: [
          {
            name: "1:100,000 Epinephrine — Box of 50",
            sku: "SEP-LIDO-100K-50",
            price: 540,
            stock: 50,
          },
        ],
      },
      specGroups: {
        create: [
          {
            name: "Composition",
            position: 1,
            specs: {
              create: [
                {
                  key: "Active Ingredient",
                  value: "Lidocaine HCl 2%",
                  position: 1,
                },
                {
                  key: "Vasoconstrictor",
                  value: "Epinephrine 1:100,000",
                  position: 2,
                },
                { key: "Volume", value: "1.8ml per cartridge", position: 3 },
              ],
            },
          },
        ],
      },
    },
  });

  // 14 — Digital X-ray Sensor (Radiology / Dentsply)
  await prisma.product.create({
    data: {
      name: "Digital Intraoral X-ray Sensor",
      slug: "digital-intraoral-xray-sensor",
      description: ["High-resolution digital sensor for intraoral radiography with USB connectivity and durable scratch-resistant housing."],
      basePrice: 18500,
      images: [productImg("X-ray Sensor")],
      categoryId: catRadiology.id,
      brandId: brandDentsply.id,
      featured: true,
      variants: {
        create: [
          {
            name: "Size 1 Sensor",
            sku: "DS-SENSOR-S1",
            price: 18500,
            stock: 4,
          },
          {
            name: "Size 2 Sensor",
            sku: "DS-SENSOR-S2",
            price: 19500,
            stock: 3,
          },
        ],
      },
      specGroups: {
        create: [
          {
            name: "Specifications",
            position: 1,
            specs: {
              create: [
                { key: "Resolution", value: "20 LP/mm", position: 1 },
                { key: "Connectivity", value: "USB 2.0", position: 2 },
                { key: "Warranty", value: "2 years", position: 3 },
              ],
            },
          },
        ],
      },
    },
  });

  // 15 — Endo Irrigation Solution (Endodontics / Coltene)
  await prisma.product.create({
    data: {
      name: "Sodium Hypochlorite Irrigation Solution",
      slug: "sodium-hypochlorite-irrigation-solution",
      description: ["Buffered sodium hypochlorite solution for root canal disinfection and debris dissolution during endodontic treatment."],
      basePrice: 145,
      images: [productImg("Irrigation Solution")],
      categoryId: catEndo.id,
      brandId: brandColtene.id,
      featured: false,
      variants: {
        create: [
          {
            name: "3% — 500ml Bottle",
            sku: "COL-NAOCL-3-500",
            price: 145,
            stock: 60,
          },
          {
            name: "5.25% — 500ml Bottle",
            sku: "COL-NAOCL-525-500",
            price: 160,
            stock: 45,
          },
        ],
      },
      specGroups: {
        create: [
          {
            name: "Composition",
            position: 1,
            specs: {
              create: [
                {
                  key: "Active Ingredient",
                  value: "Sodium Hypochlorite",
                  position: 1,
                },
                { key: "Volume", value: "500ml", position: 2 },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("  ✔ products, variants, and specifications created");

  // ───────────────────────────────────────
  // SEED USERS (for reviews)
  // ───────────────────────────────────────

  const [userAhmed, userLayla, userMohamed, userSara, userKarim] =
    await Promise.all([
      prisma.user.create({
        data: {
          name: "Dr. Ahmed Hassan",
          email: "ahmed.hassan@seed.dentastore.test",
          emailVerified: true,
          image: userAvatar("AH"),
          phone: "01012345678",
        },
      }),
      prisma.user.create({
        data: {
          name: "Dr. Layla Mahmoud",
          email: "layla.mahmoud@seed.dentastore.test",
          emailVerified: true,
          image: userAvatar("LM"),
          phone: "01098765432",
        },
      }),
      prisma.user.create({
        data: {
          name: "Dr. Mohamed Sabry",
          email: "mohamed.sabry@seed.dentastore.test",
          emailVerified: true,
          image: userAvatar("MS"),
          phone: "01122334455",
        },
      }),
      prisma.user.create({
        data: {
          name: "Dr. Sara Adel",
          email: "sara.adel@seed.dentastore.test",
          emailVerified: true,
          image: userAvatar("SA"),
          phone: "01055667788",
        },
      }),
      prisma.user.create({
        data: {
          name: "Dr. Karim Fathy",
          email: "karim.fathy@seed.dentastore.test",
          emailVerified: true,
          image: userAvatar("KF"),
          phone: "01199887766",
        },
      }),
    ]);

  console.log("  ✔ seed users created");

  // ───────────────────────────────────────
  // REVIEWS
  // ───────────────────────────────────────

  const productsForReview = await prisma.product.findMany({
    select: { id: true, slug: true },
  });

  const findProduct = (slug: string) => {
    const p = productsForReview.find((p) => p.slug === slug);
    if (!p)
      throw new Error(`Seed error: product with slug "${slug}" not found`);
    return p;
  };

  await prisma.review.createMany({
    data: [
      {
        userId: userAhmed.id,
        productId: findProduct("self-ligating-metal-brackets-roth").id,
        rating: 5,
        title: "Excellent bracket quality",
        body: "Smooth slot finish and the Roth prescription works exactly as expected. Bonding was straightforward and patients report less discomfort than our previous brand.",
        verifiedPurchase: true,
      },
      {
        userId: userLayla.id,
        productId: findProduct("self-ligating-metal-brackets-roth").id,
        rating: 4,
        title: "Reliable, good packaging",
        body: "Consistent quality across the kit. Only minor note is the tray could be better organized, but the brackets themselves perform very well.",
        verifiedPurchase: true,
      },
      {
        userId: userMohamed.id,
        productId: findProduct("rotary-niti-endodontic-file-system").id,
        rating: 5,
        title: "Great flexibility, fewer fractures",
        body: "Switched from a competitor brand and noticed immediately how much more flexible these files are in curved canals. No fractures so far after several months of use.",
        verifiedPurchase: true,
      },
      {
        userId: userSara.id,
        productId: findProduct("universal-nano-hybrid-composite-resin").id,
        rating: 5,
        title: "Shade matching is excellent",
        body: "The A2 shade blends beautifully with surrounding enamel. Handling consistency is great — doesn't slump under operatory lights.",
        verifiedPurchase: true,
      },
      {
        userId: userKarim.id,
        productId: findProduct("universal-nano-hybrid-composite-resin").id,
        rating: 4,
        title: "Good polish, slightly pricey",
        body: "Polishes up nicely and holds shine well after a few weeks. A bit more expensive than alternatives but the finish justifies it for anterior work.",
        verifiedPurchase: false,
      },
      {
        userId: userAhmed.id,
        productId: findProduct("wireless-led-curing-light").id,
        rating: 5,
        title: "Powerful and reliable",
        body: "Battery easily lasts a full day of procedures. The radiometer that comes with the pro kit is a nice touch for verifying output regularly.",
        verifiedPurchase: true,
      },
      {
        userId: userLayla.id,
        productId: findProduct("nitrile-examination-gloves-powder-free").id,
        rating: 5,
        title: "Comfortable fit, good grip",
        body: "We order these in bulk every month. Consistent sizing across boxes and the textured fingertips genuinely help with fine instrument handling.",
        verifiedPurchase: true,
      },
      {
        userId: userMohamed.id,
        productId: findProduct("digital-intraoral-xray-sensor").id,
        rating: 4,
        title: "Sharp images, easy setup",
        body: "Integration with our imaging software was straightforward. Image quality is sharp even at lower exposure settings, which patients appreciate.",
        verifiedPurchase: true,
      },
      {
        userId: userSara.id,
        productId: findProduct("superelastic-niti-archwires").id,
        rating: 4,
        title: "Consistent force delivery",
        body: "Wires maintain their form well through the initial leveling phase. Packaging keeps them protected during storage.",
        verifiedPurchase: false,
      },
      {
        userId: userKarim.id,
        productId: findProduct("high-speed-air-turbine-handpiece").id,
        rating: 4,
        title: "Quiet and lightweight",
        body: "Noticeably quieter than our older handpieces. The fiber-optic version gives great visibility without needing extra lighting adjustments.",
        verifiedPurchase: true,
      },
    ],
  });

  console.log("  ✔ reviews created");

  // ───────────────────────────────────────
  // COUPONS
  // ───────────────────────────────────────

  await prisma.coupon.createMany({
    data: [
      {
        code: "WELCOME10",
        type: "PERCENTAGE",
        value: 10,
        minOrderAmount: 500,
        maxUses: null,
        expiresAt: null,
        isActive: true,
      },
      {
        code: "DENTAL50",
        type: "FIXED",
        value: 50,
        minOrderAmount: 1000,
        maxUses: 500,
        expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 3)),
        isActive: true,
      },
      {
        code: "BULK100",
        type: "FIXED",
        value: 100,
        minOrderAmount: 2500,
        maxUses: 100,
        expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        isActive: true,
      },
    ],
  });

  console.log("  ✔ coupons created");

  console.log("✅ Seed completed successfully");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
