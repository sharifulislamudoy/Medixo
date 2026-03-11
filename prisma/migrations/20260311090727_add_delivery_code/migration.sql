-- AlterTable
ALTER TABLE "Area" ADD COLUMN     "deliveryCodeId" TEXT;

-- CreateTable
CREATE TABLE "DeliveryCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryCode_code_key" ON "DeliveryCode"("code");

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_deliveryCodeId_fkey" FOREIGN KEY ("deliveryCodeId") REFERENCES "DeliveryCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
