/*
  Warnings:

  - You are about to drop the column `secondImageUrl` on the `Advertisement` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Advertisement" DROP COLUMN "secondImageUrl",
ADD COLUMN     "detailImage" TEXT;
