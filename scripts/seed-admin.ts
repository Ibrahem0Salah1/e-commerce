// scripts/seed-admin.ts
//
// Usage:
//   ADMIN_EMAIL=owner@mds.com ADMIN_PASSWORD='...' npx tsx scripts/seed-admin.ts
//   npx tsx scripts/seed-admin.ts --email owner@mds.com --password '...'   (leaves password in shell history — prefer env vars)
//
import "dotenv/config";
import { auth } from "@/lib/auth/server";
import prisma from "@/lib/config/prisma";

function parseArgs(): { email?: string; password?: string } {
  const args = process.argv.slice(2);
  const out: { email?: string; password?: string } = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--email") out.email = args[++i];
    if (args[i] === "--password") out.password = args[++i];
  }
  return out;
}

function validateEmail(email: string): string | null {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return "Invalid email format.";
  return null;
}

function validatePassword(password: string): string | null {
  // matches emailAndPassword.minPasswordLength = 8 in lib/auth/server.ts
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 128) return "Password is unreasonably long — check for a paste error.";
  return null;
}

async function main() {
  const argv = parseArgs();
  const email = process.env.ADMIN_EMAIL ?? argv.email;
  const password = process.env.ADMIN_PASSWORD ?? argv.password;
  const name = process.env.ADMIN_NAME ?? "Admin";

  if (argv.password && !process.env.ADMIN_PASSWORD) {
    console.warn(
      "⚠️  Password passed via --password is now in your shell history. " +
        "Prefer ADMIN_PASSWORD as an env var, and rotate this password after first login.",
    );
  }

  if (!email || !password) {
    console.error(
      "Missing credentials. Set ADMIN_EMAIL + ADMIN_PASSWORD env vars, " +
        "or pass --email and --password.",
    );
    process.exit(1);
  }

  const emailError = validateEmail(email);
  if (emailError) {
    console.error(emailError);
    process.exit(1);
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    console.error(passwordError);
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error(
      `A user with email "${email}" already exists (id: ${existing.id}, role: ${existing.role}). ` +
        `Refusing to overwrite. Delete it first if you meant to re-seed.`,
    );
    process.exit(1);
  }

  // Goes through Better Auth's own API — NOT prisma.user.create() directly —
  // so the password gets hashed correctly and the matching Account row is
  // created. This also triggers databaseHooks.user.create.after, which flips
  // twoFactorEnabled to true automatically since role is ADMIN at creation.
  const result = await auth.api.createUser({
    body: { email, password, name, role: "ADMIN" },
  });

  const created = await prisma.user.findUnique({
    where: { id: result.user.id },
    select: { id: true, email: true, role: true, twoFactorEnabled: true },
  });

  if (!created) {
    console.error("User was created but could not be re-fetched — check the DB manually.");
    process.exit(1);
  }

  if (!created.twoFactorEnabled) {
    console.warn(
      "⚠️  Admin created, but twoFactorEnabled is false. " +
        "Check that databaseHooks.user.create.after in lib/auth/server.ts is firing correctly.",
    );
  }

  console.log("✅ Admin created:");
  console.log(`   id:               ${created.id}`);
  console.log(`   email:            ${created.email}`);
  console.log(`   role:             ${created.role}`);
  console.log(`   twoFactorEnabled: ${created.twoFactorEnabled}`);
  console.log("\nRotate this password after first login if it ever touched a committed .env file.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());