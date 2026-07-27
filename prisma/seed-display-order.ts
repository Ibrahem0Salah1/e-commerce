import prisma from "@/lib/config/prisma";

/**
 * Seed script: AttributeType displayOrder
 * Run with: npx tsx prisma/seed-display-order.ts
 *
 * Canonical order for product name building:
 *   Family → Size → Shade → Color → ... → Unit (unit last)
 */

async function main() {
    const orderMap: Record<string, number> = {
        size: 1,
        shade: 2,
        color: 3,
        unit: 99, // unit always last
    };

    console.log("Seeding AttributeType displayOrder values...");

    for (const [slug, displayOrder] of Object.entries(orderMap)) {
        const existing = await prisma.attributeType.findUnique({
            where: { slug },
        });

        if (!existing) {
            console.warn(`⚠️  AttributeType with slug "${slug}" not found — skipping.`);
            continue;
        }

        await prisma.attributeType.update({
            where: { slug },
            data: { displayOrder },
        });

        console.log(`✅  "${slug}" → displayOrder ${displayOrder}`);
    }

    const allTypes = await prisma.attributeType.findMany({
        orderBy: { displayOrder: "asc" },
        select: { id: true, name: true, slug: true, displayOrder: true },
    });

    console.log("\nCurrent AttributeType order:");
    console.table(allTypes);
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });