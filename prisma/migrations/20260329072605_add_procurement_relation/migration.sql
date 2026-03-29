/*
  Warnings:

  - You are about to drop the `Procurement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProcurementItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProcurementItem" DROP CONSTRAINT "ProcurementItem_procurementId_fkey";

-- DropForeignKey
ALTER TABLE "ProcurementItem" DROP CONSTRAINT "ProcurementItem_productId_fkey";

-- DropTable
DROP TABLE "Procurement";

-- DropTable
DROP TABLE "ProcurementItem";
