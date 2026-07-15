-- AlterTable
ALTER TABLE "products" ADD COLUMN     "familyId" TEXT;

-- CreateTable
CREATE TABLE "product_families" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "product_families_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_families_slug_key" ON "product_families"("slug");

-- CreateIndex
CREATE INDEX "product_families_categoryId_idx" ON "product_families"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "product_families_categoryId_name_key" ON "product_families"("categoryId", "name");

-- CreateIndex
CREATE INDEX "products_familyId_idx" ON "products"("familyId");

-- AddForeignKey
ALTER TABLE "product_families" ADD CONSTRAINT "product_families_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "product_families"("id") ON DELETE SET NULL ON UPDATE CASCADE;
