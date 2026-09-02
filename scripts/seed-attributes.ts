import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const attributeTypes = [
  {
    name: "Size",
    slug: "size",
    values: [
      { value: "Small", slug: "small" },
      { value: "Medium", slug: "medium" },
      { value: "Large", slug: "large" },
      { value: "X Large", slug: "x-large" },
    ],
  },
  {
    name: "Unit",
    slug: "unit",
    values: [
      { value: "Piece", slug: "pc" },
      { value: "Box/Pack", slug: "box-pack" },
      { value: "100pcs/box", slug: "100pcs-box" },
      { value: "100pcs/pack", slug: "100pcs-pack" },
      { value: "50pcs", slug: "50pcs" },
      { value: "52pcs", slug: "52pcs" },
      { value: "28pcs", slug: "28pcs" },
      { value: "3pcs", slug: "3pcs" },
      { value: "4pcs", slug: "4pcs" },
      { value: "5pcs", slug: "5pcs" },
      { value: "6pcs", slug: "6pcs" },
      { value: "2pcs", slug: "2pcs" },
      { value: "10pcs", slug: "10pcs" },
      { value: "12pcs", slug: "12pcs" },
      { value: "15pcs", slug: "15pcs" },
      { value: "18pcs", slug: "18pcs" },
      { value: "20pcs", slug: "20pcs" },
      { value: "25pcs", slug: "25pcs" },
      { value: "36pcs", slug: "36pcs" },
      { value: "40pcs", slug: "40pcs" },
      { value: "144pcs", slug: "144pcs" },
      { value: "180pcs", slug: "180pcs" },
      { value: "200pcs", slug: "200pcs" },
      { value: "250pcs", slug: "250pcs" },
      { value: "100pcs", slug: "100pcs" },
      { value: "1-piece", slug: "1-piece" },
      { value: "38gr", slug: "38gr" },
      { value: "2gr", slug: "2gr" },
      { value: "2.5gr", slug: "2-5gr" },
      { value: "3gr", slug: "3gr" },
      { value: "3.8gr", slug: "3-8gr" },
      { value: "4gr", slug: "4gr" },
      { value: "5gr", slug: "5gr" },
      { value: "1.8gr", slug: "1-8gr" },
      { value: "110gr", slug: "110gr" },
      { value: "40gr", slug: "40gr" },
      { value: "10ml", slug: "10ml" },
      { value: "5ml", slug: "5ml" },
      { value: "15ml", slug: "15ml" },
      { value: "25ml", slug: "25ml" },
      { value: "1.2ml", slug: "1-2ml" },
      { value: "50 Capsules", slug: "50-capsules" },
      { value: "10 Capsules", slug: "10-capsules" },
      { value: "16 Compules", slug: "16-compules" },
    ],
  },
  {
    name: "Color",
    slug: "color",
    values: [
      { value: "Red", slug: "red" },
      { value: "White", slug: "white" },
      { value: "Blue", slug: "blue" },
      { value: "Black", slug: "black" },
      { value: "Green", slug: "green" },
      { value: "Yellow", slug: "yellow" },
      { value: "Baby Blue", slug: "baby-blue" },
      { value: "Pink", slug: "pink" },
      { value: "Violet", slug: "violet" },
      { value: "Orange", slug: "orange" },
      { value: "Grey", slug: "grey" },
      { value: "Purple", slug: "purple" },
    ],
  },
  {
    name: "Shade",
    slug: "shade",
    values: [
      { value: "A1", slug: "a1" },
      { value: "A2", slug: "a2" },
      { value: "A3", slug: "a3" },
      { value: "A3.5", slug: "a3-5" },
      { value: "A4", slug: "a4" },
      { value: "B1", slug: "b1" },
      { value: "B2", slug: "b2" },
      { value: "B3", slug: "b3" },
      { value: "B3.5", slug: "b3-5" },
      { value: "B4", slug: "b4" },
      { value: "C1", slug: "c1" },
      { value: "C2", slug: "c2" },
      { value: "C3", slug: "c3" },
      { value: "C3.5", slug: "c3-5" },
      { value: "C4", slug: "c4" },
      { value: "D1", slug: "d1" },
      { value: "D2", slug: "d2" },
      { value: "D3", slug: "d3" },
      { value: "D4", slug: "d4" },
      { value: "DA2", slug: "da2" },
      { value: "OBL", slug: "obl" },
      { value: "OA3", slug: "oa3" },
      { value: "E1", slug: "e1" },
      { value: "UD", slug: "ud" },
      { value: "BD2", slug: "bd2" },
      { value: "BD3", slug: "bd3" },
      { value: "OBN", slug: "obn" },
      { value: "PA2", slug: "pa2" },
      { value: "PA3", slug: "pa3" },
      { value: "A20", slug: "a20" },
      { value: "A3O", slug: "a3o" },
    ],
  },
];

async function main() {
  for (const type of attributeTypes) {
    const attributeType = await prisma.attributeType.upsert({
      where: { slug: type.slug },
      update: {},
      create: { name: type.name, slug: type.slug },
    });

    for (const value of type.values) {
      await prisma.attributeValue.upsert({
        where: {
          attributeTypeId_value: {
            attributeTypeId: attributeType.id,
            value: value.value,
          },
        },
        update: {},
        create: {
          attributeTypeId: attributeType.id,
          value: value.value,
          slug: value.slug,
        },
      });
    }

    console.log(`  ✔ ${type.name}: ${type.values.length} values`);
  }

  console.log("Done. All attribute types and values seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
