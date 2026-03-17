-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'RETURNED';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "returnedQuantity" INTEGER NOT NULL DEFAULT 0;
