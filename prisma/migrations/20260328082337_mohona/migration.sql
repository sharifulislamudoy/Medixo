-- AlterTable
ALTER TABLE "Procurement" ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'DUE',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "supplierId" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'PURCHASE';

-- AddForeignKey
ALTER TABLE "Procurement" ADD CONSTRAINT "Procurement_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
