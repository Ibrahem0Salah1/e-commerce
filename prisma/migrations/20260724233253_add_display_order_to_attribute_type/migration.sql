/*
  Warnings:

  - You are about to drop the column `displayOrder` on the `attribute_values` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "attribute_types" ADD COLUMN     "displayOrder" INTEGER;

-- AlterTable
ALTER TABLE "attribute_values" DROP COLUMN "displayOrder";
