/*
  Warnings:

  - Added the required column `updatedAt` to the `Area` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `City` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Zone` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Area" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "City" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Zone" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
