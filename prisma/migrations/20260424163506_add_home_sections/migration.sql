-- CreateTable
CREATE TABLE "HomeSection" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "shuffleIntervalMinutes" INTEGER NOT NULL DEFAULT 60,
    "lastShuffledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeSectionProduct" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeSectionProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomeSectionProduct_sectionId_idx" ON "HomeSectionProduct"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "HomeSectionProduct_sectionId_sortOrder_key" ON "HomeSectionProduct"("sectionId", "sortOrder");

-- AddForeignKey
ALTER TABLE "HomeSectionProduct" ADD CONSTRAINT "HomeSectionProduct_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "HomeSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeSectionProduct" ADD CONSTRAINT "HomeSectionProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
