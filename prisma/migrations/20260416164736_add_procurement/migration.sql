/*
  Warnings:

  - You are about to drop the column `isSent` on the `Procurement` table. All the data in the column will be lost.
  - You are about to drop the column `supplierId` on the `Procurement` table. All the data in the column will be lost.
  - You are about to drop the column `profitMargin` on the `ProcurementItem` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `ProcurementItem` table. All the data in the column will be lost.
  - You are about to drop the column `totalCost` on the `ProcurementItem` table. All the data in the column will be lost.
  - Added the required column `currentStock` to the `ProcurementItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderQuantity` to the `ProcurementItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requiredQuantity` to the `ProcurementItem` table without a default value. This is not possible if the table is not empty.
  - Made the column `mrp` on table `ProcurementItem` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Procurement" DROP CONSTRAINT "Procurement_supplierId_fkey";

-- AlterTable
ALTER TABLE "Procurement" DROP COLUMN "isSent",
DROP COLUMN "supplierId",
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "totalAmount" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ProcurementItem" DROP COLUMN "profitMargin",
DROP COLUMN "quantity",
DROP COLUMN "totalCost",
ADD COLUMN     "currentStock" INTEGER NOT NULL,
ADD COLUMN     "orderQuantity" INTEGER NOT NULL,
ADD COLUMN     "requiredQuantity" INTEGER NOT NULL,
ALTER COLUMN "mrp" SET NOT NULL;
