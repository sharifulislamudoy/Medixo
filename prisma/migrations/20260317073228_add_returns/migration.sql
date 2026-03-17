/*
  Warnings:

  - You are about to drop the column `returnedAmount` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the `Return` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReturnItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Return" DROP CONSTRAINT "Return_orderId_fkey";

-- DropForeignKey
ALTER TABLE "Return" DROP CONSTRAINT "Return_processedById_fkey";

-- DropForeignKey
ALTER TABLE "ReturnItem" DROP CONSTRAINT "ReturnItem_orderItemId_fkey";

-- DropForeignKey
ALTER TABLE "ReturnItem" DROP CONSTRAINT "ReturnItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "ReturnItem" DROP CONSTRAINT "ReturnItem_returnId_fkey";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "returnedAmount";

-- DropTable
DROP TABLE "Return";

-- DropTable
DROP TABLE "ReturnItem";
