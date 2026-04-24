/*
  Warnings:

  - You are about to drop the `PromotionProduct` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PromotionSection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ShuffleConfig` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Advertisement` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Advertisement` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PromotionProduct" DROP CONSTRAINT "PromotionProduct_productId_fkey";

-- DropForeignKey
ALTER TABLE "PromotionProduct" DROP CONSTRAINT "PromotionProduct_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "ShuffleConfig" DROP CONSTRAINT "ShuffleConfig_sectionId_fkey";

-- AlterTable
ALTER TABLE "Advertisement" ADD COLUMN     "description" TEXT,
ADD COLUMN     "secondImageUrl" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL;

-- DropTable
DROP TABLE "PromotionProduct";

-- DropTable
DROP TABLE "PromotionSection";

-- DropTable
DROP TABLE "ShuffleConfig";

-- DropEnum
DROP TYPE "SectionType";

-- CreateIndex
CREATE UNIQUE INDEX "Advertisement_slug_key" ON "Advertisement"("slug");
