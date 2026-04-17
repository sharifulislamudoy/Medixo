/*
  Warnings:

  - You are about to drop the column `biding` on the `ProcurementItem` table. All the data in the column will be lost.
  - You are about to drop the column `requireQuantity` on the `ProcurementItem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[procurementId,productId]` on the table `ProcurementItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `image` to the `ProcurementItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `ProcurementItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requiredQuantity` to the `ProcurementItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProcurementItem" DROP COLUMN "biding",
DROP COLUMN "requireQuantity",
ADD COLUMN     "bidding" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "image" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "requiredQuantity" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ProcurementItem_procurementId_productId_key" ON "ProcurementItem"("procurementId", "productId");
