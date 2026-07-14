-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "costPriceAtSale" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "variants" ADD COLUMN     "costPrice" DECIMAL(10,2),
ADD COLUMN     "marginPercent" DECIMAL(5,2);

-- CreateTable
CREATE TABLE "purchase_invoices" (
    "id" TEXT NOT NULL,
    "supplierName" TEXT,
    "invoiceNumber" TEXT,
    "supplierPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalCost" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "purchase_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restock_entries" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "costPrice" DECIMAL(10,2) NOT NULL,
    "marginPercent" DECIMAL(5,2) NOT NULL,
    "sellingPrice" DECIMAL(10,2) NOT NULL,
    "quantityAdded" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restock_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "purchase_invoices_createdAt_idx" ON "purchase_invoices"("createdAt");

-- CreateIndex
CREATE INDEX "restock_entries_variantId_idx" ON "restock_entries"("variantId");

-- CreateIndex
CREATE INDEX "restock_entries_invoiceId_idx" ON "restock_entries"("invoiceId");

-- AddForeignKey
ALTER TABLE "restock_entries" ADD CONSTRAINT "restock_entries_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "purchase_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restock_entries" ADD CONSTRAINT "restock_entries_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
