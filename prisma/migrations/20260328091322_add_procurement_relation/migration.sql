/*
  Warnings:

  - Added the required column `supplierId` to the `Procurement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Procurement" ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'DUE',
ADD COLUMN     "supplierId" TEXT NOT NULL,
ADD COLUMN     "totalAmount" DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "Procurement" ADD CONSTRAINT "Procurement_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
