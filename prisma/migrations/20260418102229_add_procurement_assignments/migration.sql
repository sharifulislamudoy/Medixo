/*
  Warnings:

  - A unique constraint covering the columns `[procurementItemId,supplierId]` on the table `ProcurementAssignment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ProcurementAssignment_procurementItemId_supplierId_key" ON "ProcurementAssignment"("procurementItemId", "supplierId");
