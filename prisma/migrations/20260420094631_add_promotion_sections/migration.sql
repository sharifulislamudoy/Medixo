-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('TRENDING', 'OFFER', 'VALUE_FOR_MONEY');

-- CreateTable
CREATE TABLE "PromotionSection" (
    "id" TEXT NOT NULL,
    "type" "SectionType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionProduct" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShuffleConfig" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "intervalMinutes" INTEGER NOT NULL DEFAULT 60,
    "lastShuffleAt" TIMESTAMP(3),

    CONSTRAINT "ShuffleConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromotionSection_type_key" ON "PromotionSection"("type");

-- CreateIndex
CREATE UNIQUE INDEX "ShuffleConfig_sectionId_key" ON "ShuffleConfig"("sectionId");

-- AddForeignKey
ALTER TABLE "PromotionProduct" ADD CONSTRAINT "PromotionProduct_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "PromotionSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionProduct" ADD CONSTRAINT "PromotionProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShuffleConfig" ADD CONSTRAINT "ShuffleConfig_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "PromotionSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
