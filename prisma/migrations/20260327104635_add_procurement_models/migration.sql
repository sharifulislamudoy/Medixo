/*
  Warnings:

  - You are about to drop the column `status` on the `Procurement` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Procurement" DROP COLUMN "status";

-- DropEnum
DROP TYPE "ProcurementStatus";
