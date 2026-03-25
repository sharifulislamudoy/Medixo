/*
  Warnings:

  - You are about to drop the `FcmToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FcmToken" DROP CONSTRAINT "FcmToken_userId_fkey";

-- DropTable
DROP TABLE "FcmToken";
