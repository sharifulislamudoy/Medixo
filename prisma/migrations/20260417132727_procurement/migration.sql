/*
  Warnings:

  - You are about to drop the column `currentStock` on the `ProcurementItem` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `ProcurementItem` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `ProcurementItem` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ProcurementItem_procurementId_productId_key";

-- AlterTable
ALTER TABLE "Procurement" ADD COLUMN     "notes" TEXT,
ALTER COLUMN "status" SET DEFAULT true;

-- AlterTable
ALTER TABLE "ProcurementItem" DROP COLUMN "currentStock",
DROP COLUMN "image",
DROP COLUMN "name",
ALTER COLUMN "costPrice" DROP NOT NULL,
ALTER COLUMN "sellPrice" DROP NOT NULL,
ALTER COLUMN "mrp" DROP NOT NULL;
