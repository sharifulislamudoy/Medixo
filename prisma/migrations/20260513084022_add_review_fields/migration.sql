/*
  Warnings:

  - You are about to drop the `Review` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReviewPrompt` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_orderId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_userId_fkey";

-- DropForeignKey
ALTER TABLE "ReviewPrompt" DROP CONSTRAINT "ReviewPrompt_orderId_fkey";

-- DropForeignKey
ALTER TABLE "ReviewPrompt" DROP CONSTRAINT "ReviewPrompt_userId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "reviewComment" TEXT,
ADD COLUMN     "reviewRating" INTEGER,
ADD COLUMN     "reviewShown" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "Review";

-- DropTable
DROP TABLE "ReviewPrompt";
