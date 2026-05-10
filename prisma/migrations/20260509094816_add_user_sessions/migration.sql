/*
  Warnings:

  - You are about to drop the column `deviceInfo` on the `UserSession` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `UserSession` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `UserSession` table. All the data in the column will be lost.
  - You are about to drop the column `sessionToken` on the `UserSession` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sessionId]` on the table `UserSession` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sessionId` to the `UserSession` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "UserSession_expiresAt_idx";

-- DropIndex
DROP INDEX "UserSession_sessionToken_key";

-- AlterTable
ALTER TABLE "UserSession" DROP COLUMN "deviceInfo",
DROP COLUMN "expiresAt",
DROP COLUMN "ipAddress",
DROP COLUMN "sessionToken",
ADD COLUMN     "browser" TEXT,
ADD COLUMN     "ip" TEXT,
ADD COLUMN     "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "os" TEXT,
ADD COLUMN     "sessionId" TEXT NOT NULL,
ADD COLUMN     "userAgent" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_sessionId_key" ON "UserSession"("sessionId");
