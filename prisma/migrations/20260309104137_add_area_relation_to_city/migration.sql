/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Area` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `City` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Zone` table. All the data in the column will be lost.
  - You are about to drop the `DeliveryBoyProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ShopOwnerProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SupplierProfile` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `cityId` to the `Area` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Area" DROP CONSTRAINT "Area_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "DeliveryBoyProfile" DROP CONSTRAINT "DeliveryBoyProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "ShopOwnerProfile" DROP CONSTRAINT "ShopOwnerProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierProfile" DROP CONSTRAINT "SupplierProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "Zone" DROP CONSTRAINT "Zone_cityId_fkey";

-- AlterTable
ALTER TABLE "Area" DROP COLUMN "updatedAt",
ADD COLUMN     "cityId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "City" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Zone" DROP COLUMN "updatedAt";

-- DropTable
DROP TABLE "DeliveryBoyProfile";

-- DropTable
DROP TABLE "ShopOwnerProfile";

-- DropTable
DROP TABLE "SupplierProfile";

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
