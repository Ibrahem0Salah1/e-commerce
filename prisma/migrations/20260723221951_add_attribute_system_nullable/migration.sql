/*
  Warnings:

  - A unique constraint covering the columns `[sku]` on the table `products` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "cart_items" ADD COLUMN     "productId" TEXT;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "productId" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "price" DECIMAL(10,2),
ADD COLUMN     "sku" TEXT,
ADD COLUMN     "stock" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "restock_entries" ADD COLUMN     "productId" TEXT;

-- AlterTable
ALTER TABLE "variants" ALTER COLUMN "price" DROP NOT NULL,
ALTER COLUMN "stock" DROP NOT NULL;

-- CreateTable
CREATE TABLE "attribute_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "attribute_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribute_values" (
    "id" TEXT NOT NULL,
    "attributeTypeId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "attribute_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_attribute_values" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "attributeTypeId" TEXT NOT NULL,
    "attributeValueId" TEXT NOT NULL,

    CONSTRAINT "product_attribute_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attribute_types_name_key" ON "attribute_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_types_slug_key" ON "attribute_types"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_values_attributeTypeId_value_key" ON "attribute_values"("attributeTypeId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "product_attribute_values_productId_attributeTypeId_key" ON "product_attribute_values"("productId", "attributeTypeId");

-- CreateIndex
CREATE INDEX "cart_items_productId_idx" ON "cart_items"("productId");

-- CreateIndex
CREATE INDEX "order_items_productId_idx" ON "order_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "restock_entries_productId_idx" ON "restock_entries"("productId");

-- AddForeignKey
ALTER TABLE "attribute_values" ADD CONSTRAINT "attribute_values_attributeTypeId_fkey" FOREIGN KEY ("attributeTypeId") REFERENCES "attribute_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_attributeTypeId_fkey" FOREIGN KEY ("attributeTypeId") REFERENCES "attribute_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_attributeValueId_fkey" FOREIGN KEY ("attributeValueId") REFERENCES "attribute_values"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restock_entries" ADD CONSTRAINT "restock_entries_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
