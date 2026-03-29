/*
  Warnings:

  - You are about to drop the column `paymentStatus` on the `Procurement` table. All the data in the column will be lost.
  - You are about to drop the column `supplierId` on the `Procurement` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `Procurement` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Procurement" DROP CONSTRAINT "Procurement_supplierId_fkey";

-- AlterTable
ALTER TABLE "Procurement" DROP COLUMN "paymentStatus",
DROP COLUMN "supplierId",
DROP COLUMN "totalAmount";
