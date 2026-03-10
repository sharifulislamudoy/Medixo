/*
  Warnings:

  - The primary key for the `Admin` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Admin` table. All the data in the column will be lost.
  - The primary key for the `DeliveryBoy` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `DeliveryBoy` table. All the data in the column will be lost.
  - You are about to drop the column `vehicleDetails` on the `DeliveryBoy` table. All the data in the column will be lost.
  - You are about to drop the column `vehicleType` on the `DeliveryBoy` table. All the data in the column will be lost.
  - The primary key for the `ShopOwner` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `ShopOwner` table. All the data in the column will be lost.
  - The primary key for the `Supplier` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `User` table. All the data in the column will be lost.
  - Added the required column `address` to the `Admin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Admin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `Admin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `address` to the `DeliveryBoy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `DeliveryBoy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `DeliveryBoy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehicle` to the `DeliveryBoy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `address` to the `ShopOwner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `ShopOwner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `ShopOwner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `address` to the `Supplier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Supplier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `Supplier` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Area" DROP CONSTRAINT "Area_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "ShopOwner" DROP CONSTRAINT "ShopOwner_areaId_fkey";

-- DropForeignKey
ALTER TABLE "Zone" DROP CONSTRAINT "Zone_cityId_fkey";

-- DropIndex
DROP INDEX "Admin_userId_key";

-- DropIndex
DROP INDEX "DeliveryBoy_userId_key";

-- DropIndex
DROP INDEX "ShopOwner_userId_key";

-- DropIndex
DROP INDEX "Supplier_userId_key";

-- DropIndex
DROP INDEX "User_phone_key";

-- AlterTable
ALTER TABLE "Admin" DROP CONSTRAINT "Admin_pkey",
DROP COLUMN "id",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "shopName" TEXT,
ADD CONSTRAINT "Admin_pkey" PRIMARY KEY ("userId");

-- AlterTable
ALTER TABLE "DeliveryBoy" DROP CONSTRAINT "DeliveryBoy_pkey",
DROP COLUMN "id",
DROP COLUMN "vehicleDetails",
DROP COLUMN "vehicleType",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "bikeModel" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "vehicle" TEXT NOT NULL,
ADD CONSTRAINT "DeliveryBoy_pkey" PRIMARY KEY ("userId");

-- AlterTable
ALTER TABLE "ShopOwner" DROP CONSTRAINT "ShopOwner_pkey",
DROP COLUMN "id",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL,
ALTER COLUMN "areaId" DROP NOT NULL,
ADD CONSTRAINT "ShopOwner_pkey" PRIMARY KEY ("userId");

-- AlterTable
ALTER TABLE "Supplier" DROP CONSTRAINT "Supplier_pkey",
DROP COLUMN "id",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD CONSTRAINT "Supplier_pkey" PRIMARY KEY ("userId");

-- AlterTable
ALTER TABLE "User" DROP COLUMN "address",
DROP COLUMN "name",
DROP COLUMN "phone";

-- DropEnum
DROP TYPE "VehicleType";

-- AddForeignKey
ALTER TABLE "ShopOwner" ADD CONSTRAINT "ShopOwner_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
