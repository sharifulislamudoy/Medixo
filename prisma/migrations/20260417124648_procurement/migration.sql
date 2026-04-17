/*
  Warnings:

  - You are about to drop the column `notes` on the `Procurement` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `Procurement` table. All the data in the column will be lost.
  - You are about to drop the column `bidding` on the `ProcurementItem` table. All the data in the column will be lost.
  - You are about to drop the column `requiredQuantity` on the `ProcurementItem` table. All the data in the column will be lost.
  - Added the required column `requireQuantity` to the `ProcurementItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Procurement" DROP COLUMN "notes",
DROP COLUMN "totalAmount",
ALTER COLUMN "status" SET DEFAULT false;

-- AlterTable
ALTER TABLE "ProcurementItem" DROP COLUMN "bidding",
DROP COLUMN "requiredQuantity",
ADD COLUMN     "biding" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requireQuantity" INTEGER NOT NULL;
