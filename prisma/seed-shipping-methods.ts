import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultShippingMethods = [
  {
    name: "Cairo & Giza Express",
    price: 50,
    sortOrder: 1,
    isActive: true,
  },
  {
    name: "Alexandria & Delta",
    price: 75,
    sortOrder: 2,
    isActive: true,
  },
  {
    name: "University & Hospital Campus Pickup",
    price: 30,
    sortOrder: 3,
    isActive: true,
  },
  {
    name: "Upper Egypt & Other Governorates",
    price: 100,
    sortOrder: 4,
    isActive: true,
  },
];

async function main() {
  console.log("Seeding shipping methods...");
  for (const method of defaultShippingMethods) {
    const existing = await prisma.shippingMethod.findFirst({
      where: { name: method.name },
    });
    if (!existing) {
      await prisma.shippingMethod.create({
        data: method,
      });
      console.log(`Created shipping method: ${method.name} (${method.price} EGP)`);
    } else {
      console.log(`Shipping method already exists: ${method.name}`);
    }
  }
  console.log("Finished seeding shipping methods.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
