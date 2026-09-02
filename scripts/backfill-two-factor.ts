import "dotenv/config";
import prisma from "@/lib/config/prisma";
import { randomBytes } from "node:crypto";

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, email: true, twoFactorEnabled: true },
  });
  console.log(`Found ${admins.length} ADMIN(s)`);
  for (const a of admins) {
    const tf = await prisma.twoFactor.findUnique({ where: { userId: a.id } });
    console.log(`- ${a.email} (${a.id}) twoFactorEnabled=${a.twoFactorEnabled} hasRow=${!!tf}`);
    if (!tf) {
      console.log(`  → creating two_factors row for ${a.email} ...`);
      const secret = randomBytes(32).toString("hex");
      const backupCodes = Array.from({ length: 10 }).map(() => {
        const c = randomBytes(5).toString("hex").slice(0, 10).toUpperCase();
        return `${c.slice(0, 5)}-${c.slice(5)}`;
      });
      await prisma.twoFactor.create({
        data: {
          userId: a.id,
          secret,
          backupCodes: JSON.stringify(backupCodes),
          verified: true,
        },
      });
      console.log(`  ✔ created`);
      if (!a.twoFactorEnabled) {
        await prisma.user.update({ where: { id: a.id }, data: { twoFactorEnabled: true } });
        console.log(`  ✔ flipped twoFactorEnabled true`);
      }
    }
  }
  // also ensure any admin with flag false but row missing? already covered
  console.log("Done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
