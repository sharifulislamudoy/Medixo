/*
  Warnings:

  - You are about to drop the column `procurementDate` on the `Procurement` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Procurement` table. All the data in the column will be lost.
  - Made the column `supplierId` on table `Procurement` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `profitMargin` to the `ProcurementItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Procurement" DROP CONSTRAINT "Procurement_supplierId_fkey";

-- AlterTable
ALTER TABLE "Procurement" DROP COLUMN "procurementDate",
DROP COLUMN "status",
ADD COLUMN     "isSent" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "supplierId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ProcurementItem" ADD COLUMN     "profitMargin" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "mrp" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Procurement" ADD CONSTRAINT "Procurement_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
