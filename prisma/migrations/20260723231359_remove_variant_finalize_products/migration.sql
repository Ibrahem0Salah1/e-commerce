/*
  Warnings:

  - You are about to drop the column `variantId` on the `cart_items` table. All the data in the column will be lost.
  - You are about to drop the column `variantId` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `variantId` on the `restock_entries` table. All the data in the column will be lost.
  - You are about to drop the `variants` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,productId]` on the table `cart_items` will be added. If there are existing duplicate values, this will fail.
  - Made the column `productId` on table `cart_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `productId` on table `order_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `price` on table `products` required. This step will fail if there are existing NULL values in that column.
  - Made the column `stock` on table `products` required. This step will fail if there are existing NULL values in that column.
  - Made the column `productId` on table `restock_entries` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_variantId_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_productId_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_variantId_fkey";

-- DropForeignKey
ALTER TABLE "restock_entries" DROP CONSTRAINT "restock_entries_productId_fkey";

-- DropForeignKey
ALTER TABLE "restock_entries" DROP CONSTRAINT "restock_entries_variantId_fkey";

-- DropForeignKey
ALTER TABLE "variants" DROP CONSTRAINT "variants_productId_fkey";

-- DropIndex
DROP INDEX "cart_items_userId_variantId_key";

-- DropIndex
DROP INDEX "order_items_variantId_idx";

-- DropIndex
DROP INDEX "restock_entries_variantId_idx";

-- AlterTable
ALTER TABLE "cart_items" DROP COLUMN "variantId",
ALTER COLUMN "productId" SET NOT NULL;

-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "variantId",
ALTER COLUMN "productId" SET NOT NULL;

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "price" SET NOT NULL,
ALTER COLUMN "stock" SET NOT NULL;

-- AlterTable
ALTER TABLE "restock_entries" DROP COLUMN "variantId",
ALTER COLUMN "productId" SET NOT NULL;

-- DropTable
DROP TABLE "variants";

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_userId_productId_key" ON "cart_items"("userId", "productId");

-- AddForeignKey
ALTER TABLE "restock_entries" ADD CONSTRAINT "restock_entries_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
