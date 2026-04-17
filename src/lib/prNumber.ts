import { prisma } from '@/lib/prisma';

export async function generatePrNumber(): Promise<string> {
  const lastProcurement = await prisma.procurement.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { prNumber: true },
  });

  if (!lastProcurement) return 'PQ-0001';

  const lastNumber = parseInt(lastProcurement.prNumber.split('-')[1], 10);
  const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
  return `PQ-${nextNumber}`;
}