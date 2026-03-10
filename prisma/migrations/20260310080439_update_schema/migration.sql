/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Admin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DeliveryBoy` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ShopOwner` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Supplier` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[trCode]` on the table `Area` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[zoneId,code]` on the table `Area` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cityId,code]` on the table `Zone` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `trCode` to the `Area` table without a default value. This is not possible if the table is not empty.
  - Added the required column `address` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Admin" DROP CONSTRAINT "Admin_userId_fkey";

-- DropForeignKey
ALTER TABLE "DeliveryBoy" DROP CONSTRAINT "DeliveryBoy_userId_fkey";

-- DropForeignKey
ALTER TABLE "ShopOwner" DROP CONSTRAINT "ShopOwner_areaId_fkey";

-- DropForeignKey
ALTER TABLE "ShopOwner" DROP CONSTRAINT "ShopOwner_userId_fkey";

-- DropForeignKey
ALTER TABLE "Supplier" DROP CONSTRAINT "Supplier_userId_fkey";

-- DropIndex
DROP INDEX "Area_code_zoneId_key";

-- DropIndex
DROP INDEX "Zone_code_cityId_key";

-- AlterTable
ALTER TABLE "Area" ADD COLUMN     "trCode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "updatedAt",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "shopName" TEXT,
ALTER COLUMN "role" SET DEFAULT 'SHOP_OWNER';

-- DropTable
DROP TABLE "Admin";

-- DropTable
DROP TABLE "DeliveryBoy";

-- DropTable
DROP TABLE "ShopOwner";

-- DropTable
DROP TABLE "Supplier";

-- CreateIndex
CREATE UNIQUE INDEX "Area_trCode_key" ON "Area"("trCode");

-- CreateIndex
CREATE UNIQUE INDEX "Area_zoneId_code_key" ON "Area"("zoneId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Zone_cityId_code_key" ON "Zone"("cityId", "code");
