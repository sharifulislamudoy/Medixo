/*
  Warnings:

  - You are about to drop the column `address` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `dueAmount` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `paidAmount` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `shopName` on the `Order` table. All the data in the column will be lost.
  - The `paymentStatus` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Sequence` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `customerAddress` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerName` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerPhone` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('DUE', 'PAID');

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "address",
DROP COLUMN "dueAmount",
DROP COLUMN "name",
DROP COLUMN "paidAmount",
DROP COLUMN "phone",
DROP COLUMN "shopName",
ADD COLUMN     "customerAddress" TEXT NOT NULL,
ADD COLUMN     "customerName" TEXT NOT NULL,
ADD COLUMN     "customerPhone" TEXT NOT NULL,
ADD COLUMN     "customerShopName" TEXT,
ALTER COLUMN "paymentMethod" SET DEFAULT 'Cash on Delivery',
DROP COLUMN "paymentStatus",
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'DUE';

-- DropTable
DROP TABLE "Sequence";
