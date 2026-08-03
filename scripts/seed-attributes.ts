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
    ],
  },
  {
    name: "Unit",
    slug: "unit",
    values: [
      { value: "Piece", slug: "pc" },
      { value: "Box/Pack", slug: "box-pack" },
    ],
  },
  {
    name: "Color",
    slug: "color",
    values: [
      { value: "Red", slug: "red" },
      { value: "Blue", slug: "blue" },
      { value: "Black", slug: "black" },
      { value: "Yellow", slug: "yellow" },
      { value: "Baby Blue", slug: "baby-blue" },
    ],
  },
  {
    name: "Shade",
    slug: "shade",
    values: [
      { value: "A1", slug: "a1" },
      { value: "A2", slug: "a2" },
      { value: "A3", slug: "a3" },
      { value: "B1", slug: "b1" },
      { value: "B2", slug: "b2" },
      { value: "B3", slug: "b3" },
      { value: "C1", slug: "c1" },
      { value: "C2", slug: "c2" },
      { value: "C3", slug: "c3" },
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
