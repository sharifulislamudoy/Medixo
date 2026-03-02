// lib/sku.ts
import { prisma } from "./prisma";

export async function generateNextSKU(): Promise<string> {
  const products = await prisma.product.findMany({
    select: { sku: true },
    orderBy: { createdAt: "desc" },
  });

  // Find highest numeric part from SKUs like "SKU-0001"
  let maxNum = 0;
  for (const p of products) {
    const match = p.sku.match(/^SKU-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  const nextNum = maxNum + 1;
  const padded = nextNum.toString().padStart(4, "0");
  return `${padded}`;
}