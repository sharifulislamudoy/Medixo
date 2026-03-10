/*
  Warnings:

  - You are about to drop the column `areaId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Area` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `City` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Zone` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Area" DROP CONSTRAINT "Area_cityId_fkey";

-- DropForeignKey
ALTER TABLE "Area" DROP CONSTRAINT "Area_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_areaId_fkey";

-- DropForeignKey
ALTER TABLE "Zone" DROP CONSTRAINT "Zone_cityId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "areaId";

-- DropTable
DROP TABLE "Area";

-- DropTable
DROP TABLE "City";

-- DropTable
DROP TABLE "Zone";
