/**
 * DANGER: Deletes ALL users and their dependent data.
 * Use only in dev/test or after DB backup. Never run blindly in production.
 *
 * Usage:
 *   # preview (no delete):
 *   npx tsx scripts/delete-all-users.ts
 *
 *   # actually delete (requires --force):
 *   npx tsx scripts/delete-all-users.ts --force
 *   # or
 *   CONFIRM_DELETE_ALL_USERS=true npx tsx scripts/delete-all-users.ts
 *
 *   # keep orders as guest orphans (default): nullifies order.userId
 *   # to hard-delete orders too: --with-orders
 *
 * Requires: DATABASE_URL
 */

import prisma from "@/lib/config/prisma";

const force = process.argv.includes("--force") || process.env.CONFIRM_DELETE_ALL_USERS === "true";
const withOrders = process.argv.includes("--with-orders");
const dryRun = !force;

async function main() {
  console.log("=== delete-all-users ===\n");
  console.log(`Mode: ${dryRun ? "DRY-RUN (no data deleted)" : "LIVE DELETE"}`);
  console.log(`withOrders: ${withOrders ? "hard-delete orders" : "preserve orders as guest (nullify userId)"}`);
  if (process.env.NODE_ENV === "production" && dryRun) {
    console.warn("⚠️  NODE_ENV=production — refusing even dry-run preview without --force would be safer. Add --force to confirm intent.\n");
  }

  const counts = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.session.count(),
    prisma.account.count(),
    prisma.cartItem.count(),
    prisma.review.count(),
  ]);
  const [userCount, orderCount, sessionCount, accountCount, cartCount, reviewCount] = counts;
  console.log(`\nCurrent counts: users=${userCount}, orders=${orderCount}, sessions=${sessionCount}, accounts=${accountCount}, cartItems=${cartCount}, reviews=${reviewCount}`);

  if (userCount === 0) {
    console.log("No users to delete — done.");
    return;
  }

  if (dryRun) {
    console.log("\nDry-run: no changes made. Re-run with --force or CONFIRM_DELETE_ALL_USERS=true to actually delete.");
    console.log("Example: npx tsx scripts/delete-all-users.ts --force");
    return;
  }

  // Extra guard in production: require BOTH --force and env flag
  if (process.env.NODE_ENV === "production" && process.env.CONFIRM_DELETE_ALL_USERS !== "true") {
    console.error("\nRefusing to delete in production without CONFIRM_DELETE_ALL_USERS=true (even with --force).");
    console.error("Set CONFIRM_DELETE_ALL_USERS=true to confirm you have a backup and really mean it.");
    process.exit(1);
  }

  console.log(`\nProceeding to delete ${userCount} user(s)...`);
  // Preserve order history by default: nullify userId so FK doesn't fail and guest orders remain.
  if (!withOrders && orderCount > 0) {
    const r = await prisma.order.updateMany({ where: { userId: { not: null } }, data: { userId: null } });
    console.log(`→ Nullified userId on ${r.count} order(s) (preserved as guest)`);
  }
  if (withOrders && orderCount > 0) {
    // orders with Cascade from user? No, userId is nullable no cascade, so delete explicitly if requested
    const r = await prisma.order.deleteMany({ where: {} });
    console.log(`→ Hard-deleted ${r.count} order(s)`);
  }

  // Dependent tables with onDelete:Cascade will be deleted with user, but we delete explicitly for counts/logging
  const delSessions = await prisma.session.deleteMany({});
  console.log(`→ Deleted ${delSessions.count} session(s)`);
  const delAccounts = await prisma.account.deleteMany({});
  console.log(`→ Deleted ${delAccounts.count} account(s)`);
  // twoFactor is 1:1
  try {
    const del2fa = await prisma.twoFactor.deleteMany({});
    console.log(`→ Deleted ${del2fa.count} twoFactor(s)`);
  } catch {}
  const delCart = await prisma.cartItem.deleteMany({});
  console.log(`→ Deleted ${delCart.count} cartItem(s)`);
  const delReviews = await prisma.review.deleteMany({});
  console.log(`→ Deleted ${delReviews.count} review(s)`);
  // verifications are not user-fk but we keep them
  const delUsers = await prisma.user.deleteMany({});
  console.log(`\n✅ Deleted ${delUsers.count} user(s)`);

  const remaining = await prisma.user.count();
  console.log(`Remaining users: ${remaining}`);
  console.log("\nDone. If you preserved orders, they are now guest orders (userId=null).");
}

main()
  .catch((e) => {
    console.error("\n❌ delete-all-users failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
